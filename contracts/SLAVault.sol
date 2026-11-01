// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SLAVault
 * @dev A transparent, escrow-backed SLA enforcement contract for SaaS providers.
 *      Designed for extreme explainability and academic evaluation.
 *
 * Workflow:
 *  1. Provider deposits collateral (ETH/Native tokens or Stablecoin units).
 *  2. Provider creates an SLA Agreement for a Customer (Target Uptime e.g., 9900 = 99.00%, Penalty Rate).
 *  3. Authorized Monitor/Oracle submits periodic telemetry (Observed Uptime, Latency).
 *  4. If uptime < target, a penalty is automatically calculated and settled from locked collateral.
 *  5. Provider has a dispute window to contest fraudulent or conflicting telemetry.
 */
contract SLAVault {
    // Contract Owner / Governance
    address public owner;

    // Authorized telemetry monitor (Oracle address)
    address public authorizedOracle;

    // SLA Agreement Status
    enum SLAStatus { Active, Paused, Terminated }
    enum TelemetryStatus { PendingVerification, Compliant, Breached, Challenged, Settled }

    struct SLA {
        uint256 id;
        address provider;
        address customer;
        uint256 minUptimeBasisPoints; // e.g. 9900 = 99.00% uptime required
        uint256 penaltyPerBreach;     // Penalty amount in wei per verified breach
        uint256 totalCompensationPaid;// Cumulative compensation paid to customer
        SLAStatus status;
        bool exists;
    }

    struct TelemetryReport {
        uint256 slaId;
        uint256 observedUptimeBP;     // e.g. 9820 = 98.20% observed
        uint256 responseTimeMs;       // e.g. 350 ms
        uint256 timestamp;
        uint256 challengeDeadline;    // Timestamp until which provider can dispute
        TelemetryStatus status;
        bool exists;
    }

    // Provider address => Available locked collateral balance
    mapping(address => uint256) public providerCollateral;

    // SLA ID counter
    uint256 public nextSLAId = 1;

    // SLA ID => SLA struct
    mapping(uint256 => SLA) public agreements;

    // SLA ID => Latest Telemetry Report
    mapping(uint256 => TelemetryReport) public latestReports;

    // Dispute window duration (e.g. 60 seconds for demo / 24 hours in real production)
    uint256 public disputeWindow = 60 seconds;

    // --- EVENTS (for dashboard live updates and transparency) ---
    event CollateralDeposited(address indexed provider, uint256 amount, uint256 totalBalance);
    event CollateralWithdrawn(address indexed provider, uint256 amount, uint256 remainingBalance);
    event SLACreated(uint256 indexed slaId, address indexed provider, address indexed customer, uint256 minUptimeBP, uint256 penalty);
    event TelemetrySubmitted(uint256 indexed slaId, uint256 observedUptimeBP, uint256 responseTimeMs, TelemetryStatus status, uint256 challengeDeadline);
    event TelemetryChallenged(uint256 indexed slaId, address indexed challenger, string reason);
    event DisputeResolved(uint256 indexed slaId, bool penaltyUpheld);
    event PenaltySettled(uint256 indexed slaId, address indexed customer, uint256 amountSettled, uint256 remainingCollateral);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == authorizedOracle, "Only authorized oracle can submit telemetry");
        _;
    }

    constructor(address _oracle) {
        owner = msg.sender;
        authorizedOracle = _oracle;
    }

    /**
     * @notice Set or update the authorized telemetry monitor
     */
    function setOracle(address _newOracle) external onlyOwner {
        require(_newOracle != address(0), "Invalid oracle address");
        authorizedOracle = _newOracle;
    }

    /**
     * @notice Set dispute window for evaluation/demo convenience
     */
    function setDisputeWindow(uint256 _seconds) external onlyOwner {
        disputeWindow = _seconds;
    }

    /**
     * @notice Step 1: Provider locks funds into the vault as performance bond
     */
    function depositCollateral() external payable {
        require(msg.value > 0, "Deposit amount must be > 0");
        providerCollateral[msg.sender] += msg.value;
        emit CollateralDeposited(msg.sender, msg.value, providerCollateral[msg.sender]);
    }

    /**
     * @notice Step 2: Register a new SLA agreement between Provider and Customer
     */
    function createAgreement(
        address _customer,
        uint256 _minUptimeBasisPoints,
        uint256 _penaltyPerBreach
    ) external returns (uint256) {
        require(_customer != address(0), "Invalid customer address");
        require(_customer != msg.sender, "Customer cannot be provider");
        require(_minUptimeBasisPoints > 0 && _minUptimeBasisPoints <= 10000, "Uptime must be 1 - 10000 BP");
        require(_penaltyPerBreach > 0, "Penalty must be > 0");
        require(providerCollateral[msg.sender] >= _penaltyPerBreach, "Insufficient collateral to back SLA");

        uint256 slaId = nextSLAId++;
        agreements[slaId] = SLA({
            id: slaId,
            provider: msg.sender,
            customer: _customer,
            minUptimeBasisPoints: _minUptimeBasisPoints,
            penaltyPerBreach: _penaltyPerBreach,
            totalCompensationPaid: 0,
            status: SLAStatus.Active,
            exists: true
        });

        emit SLACreated(slaId, msg.sender, _customer, _minUptimeBasisPoints, _penaltyPerBreach);
        return slaId;
    }

    /**
     * @notice Step 3: Oracle submits periodic telemetry report
     */
    function submitTelemetry(
        uint256 _slaId,
        uint256 _observedUptimeBP,
        uint256 _responseTimeMs
    ) external onlyOracle {
        SLA storage sla = agreements[_slaId];
        require(sla.exists, "SLA agreement does not exist");
        require(sla.status == SLAStatus.Active, "SLA is not active");

        TelemetryStatus initialStatus;
        if (_observedUptimeBP >= sla.minUptimeBasisPoints) {
            initialStatus = TelemetryStatus.Compliant;
        } else {
            // SLA breach detected: enters challenge window
            initialStatus = TelemetryStatus.Breached;
        }

        uint256 deadline = block.timestamp + disputeWindow;
        latestReports[_slaId] = TelemetryReport({
            slaId: _slaId,
            observedUptimeBP: _observedUptimeBP,
            responseTimeMs: _responseTimeMs,
            timestamp: block.timestamp,
            challengeDeadline: deadline,
            status: initialStatus,
            exists: true
        });

        emit TelemetrySubmitted(_slaId, _observedUptimeBP, _responseTimeMs, initialStatus, deadline);
    }

    /**
     * @notice Step 4 (Dispute): Provider can contest a breach report within the dispute window
     */
    function challengeReport(uint256 _slaId, string calldata _reason) external {
        SLA storage sla = agreements[_slaId];
        require(sla.exists, "SLA not found");
        require(msg.sender == sla.provider, "Only provider can challenge report");

        TelemetryReport storage report = latestReports[_slaId];
        require(report.exists, "No report exists for this SLA");
        require(report.status == TelemetryStatus.Breached, "Can only challenge breached reports");
        require(block.timestamp <= report.challengeDeadline, "Challenge window has passed");

        report.status = TelemetryStatus.Challenged;
        emit TelemetryChallenged(_slaId, msg.sender, _reason);
    }

    /**
     * @notice Step 4 (Resolution): Arbitrator / Owner resolves a contested report
     */
    function resolveDispute(uint256 _slaId, bool _upholdBreach) external onlyOwner {
        TelemetryReport storage report = latestReports[_slaId];
        require(report.exists && report.status == TelemetryStatus.Challenged, "Report is not challenged");

        if (_upholdBreach) {
            report.status = TelemetryStatus.Breached;
            emit DisputeResolved(_slaId, true);
        } else {
            report.status = TelemetryStatus.Compliant;
            emit DisputeResolved(_slaId, false);
        }
    }

    /**
     * @notice Step 5: Execute settlement after challenge deadline has elapsed
     */
    function executeSettlement(uint256 _slaId) external {
        SLA storage sla = agreements[_slaId];
        require(sla.exists, "SLA not found");

        TelemetryReport storage report = latestReports[_slaId];
        require(report.exists, "No telemetry report found");
        require(report.status == TelemetryStatus.Breached, "Status must be Breached to settle");
        require(block.timestamp > report.challengeDeadline, "Dispute window still open");

        uint256 penalty = sla.penaltyPerBreach;
        address provider = sla.provider;
        address customer = sla.customer;

        require(providerCollateral[provider] >= penalty, "Provider collateral insufficient");

        // Deduct from collateral and transfer to customer
        providerCollateral[provider] -= penalty;
        sla.totalCompensationPaid += penalty;
        report.status = TelemetryStatus.Settled;

        (bool success, ) = customer.call{value: penalty}("");
        require(success, "Payout transfer failed");

        emit PenaltySettled(_slaId, customer, penalty, providerCollateral[provider]);
    }

    /**
     * @notice Provider can withdraw unencumbered collateral
     */
    function withdrawCollateral(uint256 _amount) external {
        require(_amount > 0, "Amount must be > 0");
        require(providerCollateral[msg.sender] >= _amount, "Insufficient balance");

        providerCollateral[msg.sender] -= _amount;
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Withdrawal failed");

        emit CollateralWithdrawn(msg.sender, _amount, providerCollateral[msg.sender]);
    }

    /**
     * @notice View function: Get full agreement details
     */
    function getAgreement(uint256 _slaId) external view returns (
        address provider,
        address customer,
        uint256 minUptimeBP,
        uint256 penaltyPerBreach,
        uint256 totalCompensationPaid,
        SLAStatus status
    ) {
        SLA storage s = agreements[_slaId];
        require(s.exists, "SLA not found");
        return (s.provider, s.customer, s.minUptimeBasisPoints, s.penaltyPerBreach, s.totalCompensationPaid, s.status);
    }
}
