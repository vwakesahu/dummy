import React, { useState, useEffect } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase.config";

const DocumentUploader = () => {
  const [documents, setDocuments] = useState([]);
  const [online, setOnline] = useState(navigator.onLine);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [docName, setDocName] = useState("");

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      uploadQueuedDocuments();
    };

    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (navigator.onLine) {
      handleOnline();
    }

    const storedFiles = Object.keys(localStorage);
    setDocuments(storedFiles.map((name) => ({ name })));

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (online && documents.length > 0) {
      uploadQueuedDocuments();
    }
  }, [online]);

  const uploadDocument = async (document) => {
    setUploading(true);
    try {
      const storageRef = ref(
        storage,
        `Documents/${Date.now()}-${document.name}`
      );
      const uploadTask = uploadBytesResumable(storageRef, document);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Handle upload progress if needed
        },
        (error) => {
          console.error("Error uploading document:", error);
          setUploading(false);
          setUploadMessage("Error uploading document. Please try again.");
          setTimeout(() => {
            setUploadMessage("");
          }, 5000);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setUploading(false);
            setUploadMessage("Document uploaded successfully.");
            // console.log(docName)
            // localStorage.removeItem(docName);
            setTimeout(() => {
              setUploadMessage("");
            }, 5000);
          });
        }
      );
    } catch (error) {
      console.error("Error uploading document:", error);
      setUploading(false);
      setUploadMessage("Error uploading document. Please try again.");
      setTimeout(() => {
        setUploadMessage("");
      }, 5000);
    }
  };

  const handleFileChange = (e) => {
    const newDocuments = Array.from(e.target.files);
    setDocuments([
      ...documents,
      ...newDocuments.map((file) => ({ name: file.name })),
    ]);
    if (online) {
      newDocuments.forEach((document) => {
        uploadDocument(document);
      });
    } else {
      saveFilesLocally(newDocuments);
    }
  };

  const dataURLtoBlob = (dataURL) => {
    const parts = dataURL.split(";base64,");
    const contentType = parts[0].split(":")[1];
    const byteCharacters = atob(parts[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  };

  const uploadQueuedDocuments = () => {
    if (online) {
      documents.forEach(async (document) => {
        const base64String = localStorage.getItem(document.name);
        setDocName(document.name);
        const blob = dataURLtoBlob(base64String);
        if (blob) {
          await uploadDocument(blob);
        }
        console.log(document.name);
        localStorage.removeItem(document.name);
      });
      setDocuments([]);
    }
  };

  const saveFilesLocally = (files) => {
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target.result;
        localStorage.setItem(file.name, base64String);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div>
      <input type="file" multiple onChange={handleFileChange} />
      {uploading && <p>Uploading...</p>}
      {uploadMessage && <p>{uploadMessage}</p>}
      <ul>
        {documents.map((document, index) => (
          <li key={index}>{document.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default DocumentUploader;
