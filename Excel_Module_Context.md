# Context for Excel Upload Module

This document outlines the complete database structure, collision-handling strategy, and backend implementation flow for an Excel Upload Module. It is designed to take an uploaded Excel file, validate its rows, and merge the data safely into the database without creating duplicate entries.

## 1. Goal
To provide an endpoint where an administrator can upload an Excel file (`.xlsx`). The system must read the data, validate it, provide logs for failed rows, and insert valid rows into the target database table without collisions.

## 2. Database Schema Design

We need three tables to track the import process and store the final data safely:

```sql
-- 1. Table to track the uploaded files
CREATE TABLE excel_imports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    uploaded_by INT NOT NULL, -- User ID who uploaded it
    status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
    total_rows INT DEFAULT 0,
    successful_rows INT DEFAULT 0,
    failed_rows INT DEFAULT 0,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL
);

-- 2. Table to track row-by-row errors for user feedback
CREATE TABLE excel_import_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    import_id INT NOT NULL,
    row_number INT NOT NULL, -- The row number in the Excel file
    error_message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (import_id) REFERENCES excel_imports(id) ON DELETE CASCADE
);

-- 3. Target Data Table (Where the actual data goes)
CREATE TABLE target_data_table (
    id INT AUTO_INCREMENT PRIMARY KEY,
    unique_code VARCHAR(100) NOT NULL, -- E.g., item_code, email, or employee_id
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- CRITICAL: This Unique Constraint prevents collisions/duplicates at the database level!
    UNIQUE KEY idx_unique_code (unique_code)
);
```

## 3. Collision Handling Strategy

To prevent collisions (duplicates) during insertion, the module relies on the `UNIQUE KEY` in the database, paired with an "Upsert" strategy:

**UPSERT (Update if exists, Insert if new)**
If the Excel file has an item that already exists in the database (based on `unique_code`), it updates the existing record with the new data from Excel.
```sql
INSERT INTO target_data_table (unique_code, name, amount) 
VALUES (?, ?, ?)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name), 
    amount = VALUES(amount);
```

*(Alternative: Use `INSERT IGNORE ...` if you prefer to skip updating existing records entirely).*

## 4. Backend Implementation Flow (Node.js)

The backend handles the following steps:
1. **File Upload Handling**: Accept `.xlsx` files using the `multer` middleware.
2. **Import Job Initialization**: Insert a record into `excel_imports` to track the file processing status.
3. **Excel Parsing**: Use the `xlsx` library to extract data from the file and convert it into a JSON array.
4. **Data Validation Loop**: 
   - Iterate through the array. 
   - Validate each row for required fields and data types.
   - For any invalid rows, insert the error details into `excel_import_logs`.
5. **Database Insertion**:
   - For valid rows, execute the UPSERT query (`ON DUPLICATE KEY UPDATE`) to merge data without collision.
6. **Finalization**: Update the `excel_imports` row with the count of successful and failed rows, setting the status to 'COMPLETED'.

## Instructions for LLM
Using the above context, please generate the complete Node.js code (Express route + MySQL2 queries) required to implement this `Excel Upload Module`. Assume `multer` and `xlsx` are installed.
