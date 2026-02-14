-- =============================================
-- TelecomDB - Encryption Setup
-- Sets up encryption keys for sensitive customer data
-- NOTE: Run this BEFORE inserting any encrypted data
-- =============================================

USE TelecomDB;
GO

-- Create Database Master Key
IF NOT EXISTS (SELECT * FROM sys.symmetric_keys WHERE name = '##MS_DatabaseMasterKey##')
BEGIN
    CREATE MASTER KEY ENCRYPTION BY PASSWORD = 'StrongMasterKeyPassword123!';
    PRINT 'Created Database Master Key';
END
GO

-- Create Certificate
IF NOT EXISTS (SELECT * FROM sys.certificates WHERE name = 'TelecomDataCert')
BEGIN
    CREATE CERTIFICATE TelecomDataCert
    WITH SUBJECT = 'Certificate for Telecom Customer Data Encryption';
    PRINT 'Created TelecomDataCert certificate';
END
GO

-- Create Symmetric Key
IF NOT EXISTS (SELECT * FROM sys.symmetric_keys WHERE name = 'TelecomDataKey')
BEGIN
    CREATE SYMMETRIC KEY TelecomDataKey
    WITH ALGORITHM = AES_256
    ENCRYPTION BY CERTIFICATE TelecomDataCert;
    PRINT 'Created TelecomDataKey symmetric key';
END
GO

PRINT 'Encryption setup complete!';
GO
