import React, { useState, useCallback } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useDropzone } from 'react-dropzone';

const UPLOAD_VIDEO = gql`
  mutation UploadVideo($title: String!, $description: String, $videoFile: Upload!, $category: String, $tags: [String!]) {
    uploadVideo(title: $title, description: $description, videoFile: $videoFile, category: $category, tags: $tags) {
      id
      title
      videoUrl
      thumbnailUrl
    }
  }
`;

const VideoUpload = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [tags, setTags] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);

    const [uploadVideo, { loading, error }] = useMutation(UPLOAD_VIDEO);

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        setVideoFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: 'video/*',
        multiple: false
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!videoFile) {
            console.error('No video file selected');
            return;
        }
        try {
            const result = await uploadVideo({
                variables: {
                    title,
                    description,
                    videoFile,
                    category,
                    tags: tags.split(',').map(tag => tag.trim()),
                },
                context: {
                    fetchOptions: {
                        onUploadProgress: (progressEvent) => {
                            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                            setUploadProgress(percentCompleted);
                        },
                    },
                },
            });

            console.log('Video uploaded successfully:', result.data.uploadVideo);
            // Reset form and show success message
            setTitle('');
            setDescription('');
            setCategory('');
            setTags('');
            setVideoFile(null);
            setPreviewUrl('');
            setUploadProgress(0);
            alert('Video uploaded successfully!');
        } catch (err) {
            console.error('Error uploading video:', err);
        }
    };

    if (error) {
        return (
          <div className="error-message">
            <h2>Error uploading video</h2>
            <p>{error.message}</p>
            <p>Error details: {JSON.stringify(error.graphQLErrors)}</p>
            <p>Network error: {JSON.stringify(error.networkError)}</p>
          </div>
        );
    }

    return (
        <div className="video-upload-container">
            <h1>Upload Your Video</h1>
            <form onSubmit={handleSubmit} className="upload-form">
                <div className="form-group">
                    <label htmlFor="title">Title:</label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description:</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="category">Category:</label>
                    <input
                        id="category"
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="tags">Tags (comma-separated):</label>
                    <input
                        id="tags"
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                    />
                </div>

                <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                    <input {...getInputProps()} />
                    {
                        isDragActive ?
                            <p>Drop the video file here ...</p> :
                            <p>Drag 'n' drop a video file here, or click to select a file</p>
                    }
                </div>

                {previewUrl && (
                    <div className="video-preview">
                        <video src={previewUrl} controls width="300" />
                    </div>
                )}

                {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="upload-progress">
                        <progress value={uploadProgress} max="100" />
                        <span>{uploadProgress}%</span>
                    </div>
                )}

                <button type="submit" disabled={loading || !videoFile}>
                    {loading ? 'Uploading...' : 'Upload Video'}
                </button>
            </form>

            <style>{`
                .video-upload-container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .upload-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .form-group {
                    display: flex;
                    flex-direction: column;
                }
                .dropzone {
                    border: 2px dashed #cccccc;
                    border-radius: 4px;
                    padding: 20px;
                    text-align: center;
                    cursor: pointer;
                }
                .dropzone.active {
                    border-color: #2196f3;
                }
                .video-preview {
                    margin-top: 20px;
                }
                .upload-progress {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                progress {
                    width: 100%;
                }
                button {
                    padding: 10px;
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                    cursor: pointer;
                }
                button:disabled {
                    background-color: #cccccc;
                }
                .error-message {
                    color: red;
                    margin-top: 20px;
                }
            `}</style>
        </div>
    );
};

export default VideoUpload;
