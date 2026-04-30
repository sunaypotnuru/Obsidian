# Bugfix Requirements Document

## Introduction

This document specifies the requirements for fixing a DNS resolution error that prevents users from uploading documents in the doctor portal. The error "Error: 24 Name or service not known" occurs when the backend service attempts to connect to Supabase Storage to upload files. This prevents doctors and patients from uploading medical documents (PDFs, images) which is a critical feature for maintaining patient records.

The bug affects the document upload functionality in the "My Documents" page where users attempt to upload files through the upload dialog. The root cause is a DNS resolution failure in the backend Docker container when trying to resolve the Supabase hostname (`woopouhicztixnkwalwv.supabase.co`).

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user uploads a document (PDF or image) through the document upload dialog THEN the system returns "Error: 24 Name or service not known" and the upload fails

1.2 WHEN the backend service attempts to connect to Supabase Storage at `https://woopouhicztixnkwalwv.supabase.co` THEN DNS resolution fails within the Docker container

1.3 WHEN the Supabase Python client tries to upload a file to the storage bucket THEN the connection fails with a DNS error before any data is transmitted

1.4 WHEN the error occurs THEN the document is not uploaded, no database record is created, and the user sees an error message in the upload dialog

### Expected Behavior (Correct)

2.1 WHEN a user uploads a document (PDF or image) through the document upload dialog THEN the system SHALL successfully upload the file to Supabase Storage without DNS errors

2.2 WHEN the backend service attempts to connect to Supabase Storage at `https://woopouhicztixnkwalwv.supabase.co` THEN DNS resolution SHALL succeed and the hostname SHALL be resolved to the correct IP address

2.3 WHEN the Supabase Python client tries to upload a file to the storage bucket THEN the connection SHALL be established successfully and the file SHALL be uploaded

2.4 WHEN the upload succeeds THEN the document SHALL be stored in Supabase Storage, a database record SHALL be created, and the user SHALL see a success message

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user uploads a valid PDF file (under 10MB) THEN the system SHALL CONTINUE TO validate the file type and size correctly

3.2 WHEN a user uploads a valid image file (JPEG, PNG, JPG, WEBP under 10MB) THEN the system SHALL CONTINUE TO validate the file type and size correctly

3.3 WHEN a user attempts to upload an invalid file type THEN the system SHALL CONTINUE TO reject it with the message "Invalid file type. Only PDF and images allowed."

3.4 WHEN a user attempts to upload a file larger than 10MB THEN the system SHALL CONTINUE TO reject it with the message "File too large. Maximum size is 10MB."

3.5 WHEN a document is successfully uploaded THEN the system SHALL CONTINUE TO create a database record with correct metadata (title, description, category, file_size, file_type)

3.6 WHEN a user views their documents list THEN the system SHALL CONTINUE TO display all uploaded documents with correct information

3.7 WHEN a user downloads a document THEN the system SHALL CONTINUE TO generate a signed URL and allow the download

3.8 WHEN a user deletes a document THEN the system SHALL CONTINUE TO remove it from both storage and the database

3.9 WHEN BYPASS_AUTH mode is enabled THEN the system SHALL CONTINUE TO map the zero-UUID to a real patient ID for testing purposes

3.10 WHEN the backend connects to other external services (Supabase database, Redis, other ML services) THEN those connections SHALL CONTINUE TO work correctly
