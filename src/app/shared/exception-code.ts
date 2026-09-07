export enum ExceptionCode {
  E001 = 'E001', // User not found
  E002 = 'E002', // User is already verified
  E003 = 'E003', // Invalid current password
  E004 = 'E004', // New password is the same as the old one
  E005 = 'E005', // JWT token date expired
  E006 = 'E006', // JWT token is invalid
  E007 = 'E007', // User already exists
  E008 = 'E008', // Invalid credentials
  E009 = 'E009', // Session expired
  E010 = 'E010', // Product or price could not be identified
  E011 = 'E011', // No URL support
  E012 = 'E012', // A network problem occurred
  E013 = 'E013', // Failed to receive data
}
