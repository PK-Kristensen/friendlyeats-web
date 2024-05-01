"use client";
import React, { useState, useEffect } from "react";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase/firebase";
import { useDropzone } from "react-dropzone";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  CloudArrowDownIcon,
  PaperClipIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { uploadBytesResumable } from "firebase/storage";

function truncateFilename(filename, maxLength) {
  if (filename.length <= maxLength) {
    return filename; // If the filename is shorter than the max length, return it as is.
  }

  // Split the filename into name and extension
  const fileParts = filename.split(".");
  const extension = fileParts.pop();
  const name = fileParts.join(".");

  // Calculate the number of characters to show before the ellipsis
  const charsToShow = maxLength - 3 - extension.length - 3; // -3 for ellipsis, -3 for the last 3 letters
  if (charsToShow <= 0) {
    // If there's not enough space, just show the beginning of the filename and the extension
    return `${filename.substring(0, 3)}...${extension}`;
  }

  // Return the truncated name
  return `${name.substring(0, charsToShow)}...${name.substring(
    name.length - 3
  )}.${extension}`;
}

async function uploadFile(file, onProgress) {
  const storage = getStorage();
  const storageRef = ref(storage, `files/${file.name}`);
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress); // Call the onProgress function with the current progress
      },
      (error) => {
        console.error("Upload failed", error);
        reject(null);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref)
          .then((downloadUrl) => {
            resolve(downloadUrl);
          })
          .catch((error) => {
            console.error("Failed to get download URL", error);
            reject(null);
          });
      }
    );
  });
}

const FileShare = ({ eventId }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchFiles = async () => {
      const eventRef = doc(db, "events", eventId);
      const docSnap = await getDoc(eventRef);
      if (docSnap.exists() && docSnap.data().files) {
        setFiles(docSnap.data().files);
      }
    };

    fetchFiles();
  }, [eventId]);

  const onDrop = async (acceptedFiles) => {
    setUploading(true);
    console.log("acceptedFiles: ", acceptedFiles);
    const eventRef = doc(db, "events", eventId);
    const urls = await Promise.all(
      acceptedFiles.map((file) => uploadFile(file, setProgress))
    );
    const validUrls = urls.filter((url) => url !== null);

    if (validUrls.length > 0) {
      await updateDoc(eventRef, {
        files: arrayUnion(...validUrls),
      });
      setFiles((prev) => [...prev, ...validUrls]);
    }
    setUploading(false);
  };

  const deleteFile = async (fileToDelete) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      const updatedFiles = files.filter((file) => file !== fileToDelete);

      // Update state first for instant UI feedback
      setFiles(updatedFiles);

      // Update Firestore document
      const eventRef = doc(db, "events", eventId);
      await updateDoc(eventRef, {
        files: updatedFiles,
      });

      // You can also delete the file from storage if needed
      // const storageRef = ref(getStorage(), fileToDelete);
      // deleteObject(storageRef);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="max-w-md p-4 bg-white rounded-lg shadow-md mt-6">
      <h3 className="text-md font-semibold text-gray-700 mb-4">Filer</h3>
      <div
        {...getRootProps()}
        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 text-center cursor-pointer hover:bg-blue-50"
        style={{ fontSize: '0.8rem'}}
      >
        <input {...getInputProps()} />
        <CloudArrowDownIcon className="h-10 w-10 text-blue-500" />
        <p className="mt-2 text-sm font-medium text-gray-700">
          Slipp filer her, eller klikk for å velge filer
        </p>
      </div>
      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 my-4">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
      {files.length > 0 && (
        <ul className="divide-y divide-gray-300 mt-4">
          {files.map((file, index) => {
            const displayName = truncateFilename(
              decodeURIComponent(file?.split("/").pop().split("?")[0]).replace(
                /^files\//,
                ""
              ),
              33
            );
            return (
              <li
                key={index}
                className="py-2 flex items-center justify-between"
              >
                <a
                  href={file}
                  download
                  className="flex items-center space-x-2 text-blue-500 hover:text-blue-700 hover:underline"
                >
                  <PaperClipIcon className="h-5 w-5" />
                  <span className="truncate">{displayName}</span>
                </a>
                <button className="flex items-center justify-center">
                  <TrashIcon className="h-5 w-5 text-red-500" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default FileShare;
