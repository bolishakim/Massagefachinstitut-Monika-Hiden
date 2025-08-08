# 🗂️ File Upload Options for n8n Integration

## 🎯 **SOLUTION**: FormData Upload (Recommended)

Your web app has been updated to send files using **FormData** instead of Base64 JSON. This is much easier to handle in n8n!

### **What Changed in Your Web App:**

- ✅ **Text messages**: Still sent as JSON
- ✅ **File uploads**: Now sent as FormData (multipart/form-data)
- ✅ **No Base64 encoding**: Files sent directly as binary data

### **How It Works Now:**

```javascript
// Text message (JSON)
POST /webhook
Content-Type: application/json
{
  "message": "Hello",
  "messageType": "text",
  "userContext": {...}
}

// File message (FormData)  
POST /webhook
Content-Type: multipart/form-data
--boundary123
Content-Disposition: form-data; name="message"

Optional caption text
--boundary123
Content-Disposition: form-data; name="messageType"

file
--boundary123
Content-Disposition: form-data; name="userContext"

{"userId":"..."}
--boundary123
Content-Disposition: form-data; name="file_0"; filename="document.pdf"
Content-Type: application/pdf

[BINARY FILE DATA HERE]
--boundary123
Content-Disposition: form-data; name="file_0_metadata"

{"name":"document.pdf","size":1024,"type":"application/pdf"}
--boundary123--
```

## 🔧 **n8n Webhook Configuration**

### **Step 1: Configure Your n8n Webhook Node**

Set these parameters:

- **HTTP Method**: `POST`
- **Path**: `/webhook` (or your preferred path)
- **Response Mode**: `Respond to Webhook`
- **Response Code**: `200`
- **Response Headers**:
  ```json
  {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  }
  ```

### **Step 2: Handle Both JSON and FormData**

In your **Function Node**, add this code:

```javascript
// Check if this is a file upload (FormData) or text message (JSON)
const isFormData = $node["Webhook"].json.headers['content-type']?.includes('multipart/form-data');

if (isFormData) {
  // Handle file upload
  console.log('Processing file upload...');
  
  // Get form data
  const formData = $node["Webhook"].json.body;
  const message = formData.message || '';
  const messageType = formData.messageType || 'file';
  const userContext = JSON.parse(formData.userContext || '{}');
  
  // Get uploaded files
  const files = $node["Webhook"].json.files || {};
  const fileKeys = Object.keys(files);
  
  if (fileKeys.length > 0) {
    const firstFileKey = fileKeys[0];
    const uploadedFile = files[firstFileKey];
    
    console.log('File received:', {
      name: uploadedFile.filename,
      size: uploadedFile.size,
      type: uploadedFile.mimetype,
      path: uploadedFile.path  // Temporary file path on n8n server
    });
    
    // The file is automatically saved to uploadedFile.path
    // You can now process it directly!
    
    return {
      message: `📁 File "${uploadedFile.filename}" uploaded successfully! Saved to: ${uploadedFile.path}`,
      filePath: uploadedFile.path,
      fileName: uploadedFile.filename,
      fileSize: uploadedFile.size,
      fileType: uploadedFile.mimetype
    };
  }
  
} else {
  // Handle regular JSON text message
  console.log('Processing text message...');
  
  const webhookData = $json.body || $json;
  const message = webhookData.message || '';
  const messageType = webhookData.messageType || 'text';
  
  return {
    message: `You said: ${message}`
  };
}
```

### **Step 3: Process the Uploaded File**

The file is automatically saved by n8n. You can process it directly:

```javascript
// Example: Read a text file
if (uploadedFile.mimetype === 'text/plain') {
  const fs = require('fs');
  const fileContent = fs.readFileSync(uploadedFile.path, 'utf8');
  
  return {
    message: `📝 Text file content:\n\n${fileContent}`
  };
}

// Example: Get file info for any file type
return {
  message: `📁 File "${uploadedFile.filename}" received!`,
  fileInfo: {
    name: uploadedFile.filename,
    size: uploadedFile.size,
    type: uploadedFile.mimetype,
    path: uploadedFile.path
  }
};
```

## 🚀 **Alternative Options**

### **Option 2: File Upload to Cloud Storage**

If you prefer cloud storage:

```javascript
// In your web app service
private async uploadToCloudStorage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('https://your-cloud-storage.com/upload', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  return result.fileUrl; // URL to download the file
}

// Then send the URL to n8n instead of the file
const payload = {
  message,
  messageType: 'file',
  fileUrl: await this.uploadToCloudStorage(file),
  fileMetadata: metadata
};
```

### **Option 3: Direct n8n File Node**

You could also use n8n's built-in **Read/Write Binary File** nodes:

1. **Webhook** → **Write Binary File** → **Your Processing** → **Respond to Webhook**

## 🎯 **Recommended Approach: FormData**

**Why FormData is best:**
- ✅ **No Base64 encoding/decoding needed**
- ✅ **n8n handles file storage automatically**  
- ✅ **Files are immediately available for processing**
- ✅ **Better memory efficiency**
- ✅ **Standard HTTP multipart upload**

## 🧪 **Testing Your Setup**

1. **Upload a text file** in your web app
2. **Check n8n execution log** - you should see:
   ```
   File received: {
     name: "test.txt",
     path: "/tmp/n8n-files/abc123/test.txt",
     size: 1024,
     type: "text/plain"
   }
   ```
3. **Verify the file exists** at the path shown in the log
4. **Process the file** using standard Node.js file operations

Your web app is now configured to send files via FormData - much easier to handle in n8n! 🚀