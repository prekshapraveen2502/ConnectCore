-- =============================================
-- TelecomDB - Stored Procedures
-- =============================================

USE TelecomDB;
GO

-- =============================================
-- SP: sp_ValidateAdminLogin
-- Purpose: Validate admin credentials
-- =============================================
CREATE OR ALTER PROCEDURE sp_ValidateAdminLogin
    @Username VARCHAR(50),
    @Password VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT COUNT(*) as IsValid
    FROM ADMIN_LOGIN
    WHERE Username = @Username AND Password = @Password;
END
GO

-- =============================================
-- SP: sp_ValidateCustomerLogin
-- Purpose: Validate customer credentials
-- =============================================
CREATE OR ALTER PROCEDURE sp_ValidateCustomerLogin
    @Username VARCHAR(50),
    @Password VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT CustomerID, 1 as IsValid 
    FROM CUSTOMER_LOGIN 
    WHERE Username = @Username AND Password = @Password;
END
GO

-- =============================================
-- SP: sp_AddCustomer
-- Purpose: Create a new customer with encrypted data
-- =============================================
CREATE OR ALTER PROCEDURE sp_AddCustomer
    @CustomerName NVARCHAR(100),
    @PhoneNumber INT,
    @DOB DATE,
    @CustomerID INT OUTPUT,
    @ErrorMessage NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validate inputs
        IF @CustomerName IS NULL OR LEN(@CustomerName) = 0
        BEGIN
            SET @ErrorMessage = 'Customer name is required';
            THROW 50001, @ErrorMessage, 1;
        END
        
        IF @DOB > GETDATE()
        BEGIN
            SET @ErrorMessage = 'Date of birth cannot be in the future';
            THROW 50002, @ErrorMessage, 1;
        END
        
        -- Open the symmetric key for encryption
        OPEN SYMMETRIC KEY TelecomDataKey
        DECRYPTION BY CERTIFICATE TelecomDataCert;
        
        -- Insert customer with encrypted data
        INSERT INTO CUSTOMER (
            CustomerName, PhoneNumber, DOB, StartDate, Status,
            CustomerName_Encrypted, PhoneNumber_Encrypted
        )
        VALUES (
            @CustomerName,
            @PhoneNumber,
            @DOB,
            GETDATE(),
            'Active',
            EncryptByKey(Key_GUID('TelecomDataKey'), @CustomerName),
            EncryptByKey(Key_GUID('TelecomDataKey'), CAST(@PhoneNumber AS NVARCHAR(50)))
        );
        
        SET @CustomerID = SCOPE_IDENTITY();
        
        -- Close the symmetric key
        CLOSE SYMMETRIC KEY TelecomDataKey;
        
        SET @ErrorMessage = 'Customer added successfully';
        
        COMMIT TRANSACTION;
        RETURN 0;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        -- Close key if still open
        IF EXISTS (SELECT * FROM sys.openkeys WHERE key_name = 'TelecomDataKey')
            CLOSE SYMMETRIC KEY TelecomDataKey;
        
        SET @ErrorMessage = ERROR_MESSAGE();
        SET @CustomerID = NULL;
        RETURN -1;
    END CATCH
END
GO

-- =============================================
-- SP: sp_UpdateCustomer
-- Purpose: Update customer information with encryption
-- =============================================
CREATE OR ALTER PROCEDURE sp_UpdateCustomer
    @CustomerID INT,
    @CustomerName NVARCHAR(100) = NULL,
    @PhoneNumber INT = NULL,
    @DOB DATE = NULL,
    @Status VARCHAR(10) = NULL,
    @ErrorMessage NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        IF NOT EXISTS (SELECT 1 FROM CUSTOMER WHERE CustomerID = @CustomerID)
        BEGIN
            SET @ErrorMessage = 'Customer not found';
            THROW 50040, @ErrorMessage, 1;
        END
        
        IF @Status IS NOT NULL AND @Status NOT IN ('Active', 'Deactive')
        BEGIN
            SET @ErrorMessage = 'Invalid status. Must be Active or Deactive';
            THROW 50041, @ErrorMessage, 1;
        END
        
        IF @CustomerName IS NOT NULL OR @PhoneNumber IS NOT NULL
        BEGIN
            OPEN SYMMETRIC KEY TelecomDataKey
            DECRYPTION BY CERTIFICATE TelecomDataCert;
        END
        
        UPDATE CUSTOMER
        SET 
            CustomerName = ISNULL(@CustomerName, CustomerName),
            PhoneNumber = ISNULL(@PhoneNumber, PhoneNumber),
            DOB = ISNULL(@DOB, DOB),
            Status = ISNULL(@Status, Status),
            CustomerName_Encrypted = CASE 
                WHEN @CustomerName IS NOT NULL 
                THEN EncryptByKey(Key_GUID('TelecomDataKey'), @CustomerName)
                ELSE CustomerName_Encrypted 
            END,
            PhoneNumber_Encrypted = CASE 
                WHEN @PhoneNumber IS NOT NULL 
                THEN EncryptByKey(Key_GUID('TelecomDataKey'), CAST(@PhoneNumber AS NVARCHAR(50)))
                ELSE PhoneNumber_Encrypted 
            END
        WHERE CustomerID = @CustomerID;
        
        IF EXISTS (SELECT * FROM sys.openkeys WHERE key_name = 'TelecomDataKey')
            CLOSE SYMMETRIC KEY TelecomDataKey;
        
        SET @ErrorMessage = 'Customer updated successfully';
        
        COMMIT TRANSACTION;
        RETURN 0;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        IF EXISTS (SELECT * FROM sys.openkeys WHERE key_name = 'TelecomDataKey')
            CLOSE SYMMETRIC KEY TelecomDataKey;
        
        SET @ErrorMessage = ERROR_MESSAGE();
        RETURN -1;
    END CATCH
END
GO

-- =============================================
-- SP: sp_GenerateBill
-- Purpose: Generate monthly bill for a subscription
-- =============================================
CREATE OR ALTER PROCEDURE sp_GenerateBill
    @SubscriptionID INT,
    @BillingMonth DATE,
    @BillID INT OUTPUT,
    @ErrorMessage NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CustomerID INT;
    DECLARE @PlanID INT;
    DECLARE @PlanType VARCHAR(20);
    DECLARE @DataLimit FLOAT;
    DECLARE @TotalDataUsed FLOAT;
    DECLARE @TotalMinutesUsed INT;
    DECLARE @TotalSMSUsed INT;
    DECLARE @MonthlyFee DECIMAL(10,2);
    DECLARE @CostPerGB DECIMAL(10,2);
    DECLARE @CostPerMin DECIMAL(10,2);
    DECLARE @CostPerMessage DECIMAL(10,2);
    DECLARE @PrepaidCost DECIMAL(10,2);
    DECLARE @OverageCharges DECIMAL(10,2) = 0;
    DECLARE @TotalAmount DECIMAL(10,2) = 0;
    DECLARE @DataOverage FLOAT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Get subscription details
        SELECT @CustomerID = CustomerID, @PlanID = PlanID
        FROM SUBSCRIPTION
        WHERE SubscriptionID = @SubscriptionID AND Status = 'Active';
        
        IF @CustomerID IS NULL
        BEGIN
            SET @ErrorMessage = 'Active subscription not found';
            THROW 50020, @ErrorMessage, 1;
        END
        
        -- Check for duplicate bill
        IF EXISTS (
            SELECT 1 FROM BILL 
            WHERE SubscriptionID = @SubscriptionID 
            AND MONTH(BillingMonth) = MONTH(@BillingMonth) 
            AND YEAR(BillingMonth) = YEAR(@BillingMonth)
        )
        BEGIN
            SET @ErrorMessage = 'Bill already generated for this month';
            THROW 50021, @ErrorMessage, 1;
        END
        
        -- Get plan details
        SELECT @PlanType = PlanType, @DataLimit = DataLimit
        FROM [PLAN]
        WHERE PlanID = @PlanID;
        
        -- Calculate usage for the billing month
        SELECT 
            @TotalDataUsed = ISNULL(SUM(DataUsed), 0),
            @TotalMinutesUsed = ISNULL(SUM(MinutesUsed), 0),
            @TotalSMSUsed = ISNULL(SUM(SMSUsed), 0)
        FROM [USAGE]
        WHERE SubscriptionID = @SubscriptionID
            AND MONTH(StartDateTime) = MONTH(@BillingMonth)
            AND YEAR(StartDateTime) = YEAR(@BillingMonth);
        
        -- Calculate bill based on plan type
        IF @PlanType = 'Postpaid'
        BEGIN
            SELECT @MonthlyFee = MonthlyFee, @CostPerGB = CostPerGB,
                   @CostPerMin = CostPerMin, @CostPerMessage = CostPerMessage
            FROM POSTPAID WHERE PlanID = @PlanID;
            
            SET @DataOverage = CASE WHEN @TotalDataUsed > @DataLimit THEN @TotalDataUsed - @DataLimit ELSE 0 END;
            
            SET @OverageCharges = (@DataOverage * @CostPerGB) + 
                                  (@TotalMinutesUsed * @CostPerMin) + 
                                  (@TotalSMSUsed * @CostPerMessage);
            
            SET @TotalAmount = @MonthlyFee + @OverageCharges;
        END
        ELSE
        BEGIN
            SELECT @PrepaidCost = Cost FROM PREPAID WHERE PlanID = @PlanID;
            SET @TotalAmount = ISNULL(@PrepaidCost, 0);
            SET @OverageCharges = 0;
        END
        
        -- Insert bill
        INSERT INTO BILL (CustomerID, SubscriptionID, BillingMonth, TotalAmount, OverageCharges, DueDate, Status)
        VALUES (@CustomerID, @SubscriptionID, @BillingMonth, @TotalAmount, @OverageCharges,
                DATEADD(DAY, 30, GETDATE()), 'Pending');
        
        SET @BillID = SCOPE_IDENTITY();
        SET @ErrorMessage = 'Bill generated successfully';
        
        COMMIT TRANSACTION;
        RETURN 0;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SET @ErrorMessage = ERROR_MESSAGE();
        SET @BillID = NULL;
        RETURN -1;
    END CATCH
END
GO

-- =============================================
-- SP: sp_TrackUsage
-- Purpose: Record usage and calculate overages
-- =============================================
CREATE OR ALTER PROCEDURE sp_TrackUsage
    @SubscriptionID INT,
    @StartDateTime DATETIME,
    @StopDateTime DATETIME,
    @DataUsed FLOAT = 0,
    @MinutesUsed INT = 0,
    @SMSUsed INT = 0,
    @UsageID INT OUTPUT,
    @OverageAmount DECIMAL(10,2) OUTPUT,
    @ErrorMessage NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @PlanID INT;
    DECLARE @PlanType VARCHAR(20);
    DECLARE @DataLimit FLOAT;
    DECLARE @TotalDataUsed FLOAT;
    DECLARE @TotalMinutesUsed INT;
    DECLARE @TotalSMSUsed INT;
    DECLARE @CostPerGB DECIMAL(10,2);
    DECLARE @CostPerMin DECIMAL(10,2);
    DECLARE @CostPerMessage DECIMAL(10,2);
    DECLARE @DataOverage FLOAT;
    DECLARE @MinutesOverage INT;
    DECLARE @SMSOverage INT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validate subscription
        IF NOT EXISTS (SELECT 1 FROM SUBSCRIPTION WHERE SubscriptionID = @SubscriptionID AND Status = 'Active')
        BEGIN
            SET @ErrorMessage = 'Active subscription not found';
            THROW 50010, @ErrorMessage, 1;
        END
        
        IF @StopDateTime <= @StartDateTime
        BEGIN
            SET @ErrorMessage = 'Stop time must be after start time';
            THROW 50011, @ErrorMessage, 1;
        END
        
        -- Get plan details
        SELECT @PlanID = PlanID FROM SUBSCRIPTION WHERE SubscriptionID = @SubscriptionID;
        
        SELECT @PlanType = PlanType, @DataLimit = DataLimit
        FROM [PLAN] WHERE PlanID = @PlanID;
        
        -- Insert usage record
        INSERT INTO [USAGE] (SubscriptionID, StartDateTime, StopDateTime, DataUsed, MinutesUsed, SMSUsed)
        VALUES (@SubscriptionID, @StartDateTime, @StopDateTime, @DataUsed, @MinutesUsed, @SMSUsed);
        
        SET @UsageID = SCOPE_IDENTITY();
        SET @OverageAmount = 0;
        
        IF @PlanType = 'Postpaid'
        BEGIN
            SELECT @CostPerGB = CostPerGB, @CostPerMin = CostPerMin, @CostPerMessage = CostPerMessage
            FROM POSTPAID WHERE PlanID = @PlanID;
            
            SELECT 
                @TotalDataUsed = ISNULL(SUM(DataUsed), 0),
                @TotalMinutesUsed = ISNULL(SUM(MinutesUsed), 0),
                @TotalSMSUsed = ISNULL(SUM(SMSUsed), 0)
            FROM [USAGE]
            WHERE SubscriptionID = @SubscriptionID
                AND MONTH(StartDateTime) = MONTH(GETDATE())
                AND YEAR(StartDateTime) = YEAR(GETDATE());
            
            SET @DataOverage = CASE WHEN @TotalDataUsed > @DataLimit THEN @TotalDataUsed - @DataLimit ELSE 0 END;
            SET @MinutesOverage = @TotalMinutesUsed;
            SET @SMSOverage = @TotalSMSUsed;
            
            SET @OverageAmount = (@DataOverage * @CostPerGB) + 
                                 (@MinutesOverage * @CostPerMin) + 
                                 (@SMSOverage * @CostPerMessage);
        END
        
        SET @ErrorMessage = 'Usage tracked successfully';
        
        COMMIT TRANSACTION;
        RETURN 0;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SET @ErrorMessage = ERROR_MESSAGE();
        SET @OverageAmount = NULL;
        SET @UsageID = NULL;
        RETURN -1;
    END CATCH
END
GO

-- =============================================
-- SP: sp_GetCustomerInfo
-- Purpose: Retrieve customer info with decrypted data
-- =============================================
CREATE OR ALTER PROCEDURE sp_GetCustomerInfo
    @CustomerID INT,
    @ErrorMessage NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM CUSTOMER WHERE CustomerID = @CustomerID)
        BEGIN
            SET @ErrorMessage = 'Customer not found';
            THROW 50030, @ErrorMessage, 1;
        END
        
        OPEN SYMMETRIC KEY TelecomDataKey
        DECRYPTION BY CERTIFICATE TelecomDataCert;
        
        SELECT 
            c.CustomerID,
            c.CustomerName,
            CONVERT(NVARCHAR(100), DecryptByKey(c.CustomerName_Encrypted)) AS DecryptedName,
            c.PhoneNumber,
            CONVERT(NVARCHAR(50), DecryptByKey(c.PhoneNumber_Encrypted)) AS DecryptedPhone,
            c.DOB,
            DATEDIFF(YEAR, c.DOB, GETDATE()) - 
                CASE WHEN DATEADD(YEAR, DATEDIFF(YEAR, c.DOB, GETDATE()), c.DOB) > GETDATE() 
                THEN 1 ELSE 0 END AS Age,
            c.Email,
            c.StartDate,
            c.EndDate,
            c.Status
        FROM CUSTOMER c
        WHERE c.CustomerID = @CustomerID;
        
        CLOSE SYMMETRIC KEY TelecomDataKey;
        
        SET @ErrorMessage = 'Customer info retrieved successfully';
        RETURN 0;
    END TRY
    BEGIN CATCH
        IF EXISTS (SELECT * FROM sys.openkeys WHERE key_name = 'TelecomDataKey')
            CLOSE SYMMETRIC KEY TelecomDataKey;
        
        SET @ErrorMessage = ERROR_MESSAGE();
        RETURN -1;
    END CATCH
END
GO

PRINT 'All stored procedures created successfully!';
GO
