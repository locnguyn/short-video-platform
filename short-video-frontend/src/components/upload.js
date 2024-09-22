import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useMutation, gql, useQuery } from '@apollo/client';
import {
    Button,
    TextField,
    Box,
    Typography,
    CircularProgress,
    Select,
    MenuItem,
    Chip,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import VideoPreview from './VideoPreview';

const UPLOAD_VIDEO = gql`
  mutation UploadVideo($title: String!, $videoFile: Upload!, $thumbnailFile: Upload, $category: ID, $tags: [String!]) {
    uploadVideo(title: $title, videoFile: $videoFile, thumbnailFile: $thumbnailFile, category: $category, tags: $tags) {
      id
    }
  }
`;

const GET_CATEGORIES = gql`
    query GetCategories {
        getCategories {
            id,
            name
        }
    }
`

const TagInput = React.memo(({ tags, onAddTag, onRemoveTag }) => {
    const [currentTag, setCurrentTag] = useState('');

    const handleAddTag = (event) => {
        if (event.key === 'Enter' && currentTag.trim() !== '') {
            onAddTag(currentTag.trim());
            setCurrentTag('');
            event.preventDefault();
        }
    };

    return (
        <Box sx={{ my: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
                Tags:
            </Typography>
            <TextField
                fullWidth
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Nhập tag và nhấn Enter"
                margin="normal"
            />
            <Box sx={{ mt: 1 }}>
                {tags.map((tag, index) => (
                    <Chip
                        key={index}
                        label={tag}
                        onDelete={() => onRemoveTag(tag)}
                        sx={{ mr: 0.5, mb: 0.5 }}
                    />
                ))}
            </Box>
        </Box>
    );
});

const UploadVideo = () => {
    const [title, setTitle] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [category, setCategory] = useState('');
    const [tags, setTags] = useState([]);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
    const [uploadVideo, { loading, error }] = useMutation(UPLOAD_VIDEO);
    const { loading: loadingCate, error: cateError, data: cateData } = useQuery(GET_CATEGORIES);

    const videoInputRef = useRef();
    const thumbnailInputRef = useRef();

    const handleVideoChange = useCallback((event) => {
        const file = event.target.files[0];
        setVideoFile(file);
        setVideoPreviewUrl(URL.createObjectURL(file));
    }, []);

    const handleThumbnailChange = useCallback((event) => {
        setThumbnailFile(event.target.files[0]);
    }, []);

    const handleAddTag = useCallback((newTag) => {
        setTags(prevTags => [...prevTags, newTag]);
    }, []);

    const handleRemoveTag = useCallback((tagToRemove) => {
        setTags(prevTags => prevTags.filter(tag => tag !== tagToRemove));
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            console.log({
                title,
                videoFile,
                thumbnailFile,
                category,
                tags
            })
            const { data } = await uploadVideo({
                variables: {
                    title,
                    videoFile,
                    thumbnailFile,
                    category,
                    tags
                }
            });
            console.log('Video uploaded:', data.uploadVideo);
            // Handle success (e.g., show a success message, redirect to the video page)
        } catch (err) {
            console.error('Error uploading video:', err);
            if (err.graphQLErrors) {
                err.graphQLErrors.forEach(({ message, locations, path }) => {
                    console.log(
                        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
                    );
                });
            }
            if (err.networkError) {
                console.log(`[Network error]: ${err.networkError}`);
            }
            // setE(err.message || 'An error occurred while uploading the video. Please try again.');
        }
    };

    const categories = useMemo(() => {
        return cateData ? cateData.getCategories : [];
    }, [cateData]);

    return (
        <Box sx={{ maxWidth: 600, margin: 'auto', padding: 3 }}>
            <Typography variant="h4" gutterBottom>
                Tải lên Video
            </Typography>
            <form onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    label="Tiêu đề Video"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    margin="normal"
                    required
                />
                <Box sx={{ my: 2 }}>
                    <input
                        accept="video/*"
                        style={{ display: 'none' }}
                        id="video-file"
                        type="file"
                        onChange={handleVideoChange}
                        ref={videoInputRef}
                    />
                    <label htmlFor="video-file">
                        <Button
                            variant="contained"
                            component="span"
                            startIcon={<CloudUploadIcon />}
                        >
                            Chọn Video
                        </Button>
                    </label>
                    {videoFile && <Typography sx={{ mt: 1 }}>{videoFile.name}</Typography>}
                </Box>
                {videoFile && (
                    <Box sx={{ my: 2, width: '100%', display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                        <VideoPreview
                            videoUrl={videoPreviewUrl}
                            thumbnailUrl={thumbnailFile ? URL.createObjectURL(thumbnailFile) : ''}
                            title={title || 'Video Preview'}
                        />
                    </Box>
                )}
                <Box sx={{ my: 2 }}>
                    <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="thumbnail-file"
                        type="file"
                        onChange={handleThumbnailChange}
                        ref={thumbnailInputRef}
                    />
                    <label htmlFor="thumbnail-file">
                        <Button
                            variant="outlined"
                            component="span"
                            startIcon={<CloudUploadIcon />}
                        >
                            Chọn Ảnh thumbnail
                        </Button>
                    </label>
                    {thumbnailFile && <Typography sx={{ mt: 1 }}>{thumbnailFile.name}</Typography>}
                </Box>
                <Select
                    fullWidth
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    displayEmpty
                    margin="normal"
                >
                    <MenuItem value="" disabled>
                        Chọn danh mục
                    </MenuItem>
                    {
                        cateData && cateData.getCategories.map((c) =>
                            <MenuItem value={c.id} key={c.id}>
                                {c.name}
                            </MenuItem>
                        )
                    }
                </Select>
                <TagInput
                    tags={tags}
                    onAddTag={handleAddTag}
                    onRemoveTag={handleRemoveTag}
                />
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading || !videoFile}
                    sx={{ mt: 2 }}
                >
                    {loading ? <CircularProgress size={24} /> : 'Tải lên'}
                </Button>
            </form>
            {error && (
                <Typography color="error" sx={{ mt: 2 }}>
                    Lỗi: {error.message}
                </Typography>
            )}
        </Box>
    );
};

export default UploadVideo;
