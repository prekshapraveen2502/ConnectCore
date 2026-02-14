-- =============================================
-- TelecomDB - Sample Seed Data
-- Inserts sample data for testing
-- Run AFTER tables and stored procedures are created
-- =============================================

USE TelecomDB;
GO

-- =============================================
-- Seed: Admin Login
-- =============================================
IF NOT EXISTS (SELECT 1 FROM ADMIN_LOGIN WHERE Username = 'admin')
BEGIN
    INSERT INTO ADMIN_LOGIN (Username, Password) VALUES ('admin', 'admin123');
    PRINT 'Inserted default admin user (admin / admin123)';
END
GO

-- =============================================
-- Seed: Sample Plans
-- =============================================
IF NOT EXISTS (SELECT 1 FROM [PLAN] WHERE PlanName = 'Basic Postpaid')
BEGIN
    INSERT INTO [PLAN] (PlanName, DataLimit, Description, PlanType)
    VALUES 
        ('Basic Postpaid', 5, 'Basic plan with 5GB data, ideal for light usage', 'Postpaid'),
        ('Premium Postpaid', 20, 'Premium plan with 20GB data, unlimited calls', 'Postpaid'),
        ('Starter Prepaid', 2, 'Affordable prepaid plan with 2GB data', 'Prepaid'),
        ('Value Prepaid', 10, 'Great value prepaid plan with 10GB data', 'Prepaid');
    PRINT 'Inserted sample plans';
    
    -- Add postpaid rates
    INSERT INTO POSTPAID (PlanID, CostPerGB, CostPerMin, CostPerMessage, MonthlyFee)
    SELECT PlanID, 10.00, 0.05, 0.01, 29.99
    FROM [PLAN] WHERE PlanName = 'Basic Postpaid';
    
    INSERT INTO POSTPAID (PlanID, CostPerGB, CostPerMin, CostPerMessage, MonthlyFee)
    SELECT PlanID, 5.00, 0.00, 0.00, 59.99
    FROM [PLAN] WHERE PlanName = 'Premium Postpaid';
    
    -- Add prepaid costs
    INSERT INTO PREPAID (PlanID, Cost, ValidityDays)
    SELECT PlanID, 9.99, 30
    FROM [PLAN] WHERE PlanName = 'Starter Prepaid';
    
    INSERT INTO PREPAID (PlanID, Cost, ValidityDays)
    SELECT PlanID, 24.99, 30
    FROM [PLAN] WHERE PlanName = 'Value Prepaid';
    
    PRINT 'Inserted postpaid and prepaid details';
END
GO

PRINT 'Seed data inserted successfully!';
GO
