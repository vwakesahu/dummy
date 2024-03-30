import React, { useState, useEffect } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase.config';

const DocumentUploader = () => {
    const [documents, setDocuments] = useState([]);
    const [online, setOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => {
            const storedDocuments = localStorage.getItem('documents');
            if (storedDocuments) {
                const documents = JSON.parse(storedDocuments);
                documents.forEach(document => {
                    const storageRef = ref(storage, `Documents/${Date.now()}-${document.name}`);
                    const uploadTask = uploadBytesResumable(storageRef, document);

                    uploadTask.on(
                        "state_changed",
                        (snapshot) => {
                            // Handle upload progress if needed
                        },
                        (error) => {
                            console.log(error);
                            // Handle error if needed
                        },
                        () => {
                            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                                // Handle successful upload
                            });
                        }
                    );
                });
                localStorage.removeItem('documents');
            }
            setOnline(true);
        };

        const handleOffline = () => {
            setOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleFileChange = (e) => {
        const newDocuments = Array.from(e.target.files);
        setDocuments([...documents, ...newDocuments]);
        if (!online) {
            localStorage.setItem('documents', JSON.stringify([...documents, ...newDocuments]));
        } else {
            // Actual upload logic here
            newDocuments.forEach(document => {
                const storageRef = ref(storage, `Documents/${Date.now()}-${document.name}`);
                const uploadTask = uploadBytesResumable(storageRef, document);

                uploadTask.on(
                    "state_changed",
                    (snapshot) => {
                        // Handle upload progress if needed
                    },
                    (error) => {
                        console.log(error);
                        // Handle error if needed
                    },
                    () => {
                        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                            // Handle successful upload
                        });
                    }
                );
            });
        }
    };

    return (
        <div>
            <input type="file" multiple onChange={handleFileChange} />
            <ul>
                {documents.map((document, index) => (
                    <li key={index}>{document.name}</li>
                ))}
            </ul>
        </div>
    );
};

export default DocumentUploader;
