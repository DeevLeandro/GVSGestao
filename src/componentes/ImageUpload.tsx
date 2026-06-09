import React, { useState, useRef } from 'react';

interface ImageUploadProps {
    onImageSelect: (file: File | null) => void;
    currentImage?: string;
    label?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
    onImageSelect,
    currentImage,
    label = "Imagem do Produto"
}) => {
    const [preview, setPreview] = useState<string>(currentImage || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validação de tipo e tamanho
            if (!file.type.startsWith('image/')) {
                alert('Por favor, selecione apenas arquivos de imagem.');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('A imagem deve ter no máximo 5MB.');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            onImageSelect(file);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const removeImage = () => {
        setPreview(currentImage || '');
        onImageSelect(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div style={{
            width: '100%',
            margin: '16px 0',
            padding: '16px',
            border: '2px solid #2196F3',
            borderRadius: '8px',
            backgroundColor: '#E3F2FD'
        }}>
            <label style={{
                display: 'block',
                marginBottom: '12px',
                fontWeight: 'bold',
                fontSize: '16px',
                color: '#1976D2'
            }}>
                {label}
            </label>

            {/* Preview da imagem */}
            {preview && (
                <div style={{
                    marginBottom: '16px',
                    textAlign: 'center',
                    backgroundColor: '#fff',
                    padding: '12px',
                    borderRadius: '8px'
                }}>
                    <img
                        src={preview}
                        alt="Preview"
                        style={{
                            maxHeight: '150px',
                            maxWidth: '100%',
                            borderRadius: '4px',
                            objectFit: 'contain'
                        }}
                    />
                </div>
            )}

            {/* Botões de ação */}
            <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap'
            }}>
                <button
                    type="button"
                    onClick={handleUploadClick}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#45a049';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#4CAF50';
                    }}
                >
                    📤 {preview ? 'Trocar Imagem' : 'Upload de Imagem'}
                </button>

                {preview && (
                    <button
                        type="button"
                        onClick={removeImage}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#da190b';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#f44336';
                        }}
                    >
                        🗑️ Remover Imagem
                    </button>
                )}
            </div>

            {/* Área clicável alternativa */}
            <div
                onClick={handleUploadClick}
                style={{
                    border: '2px dashed #ccc',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#fff',
                    marginTop: '12px',
                    transition: 'border-color 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#4CAF50';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#ccc';
                }}
            >
                <div style={{ fontSize: '32px' }}>📷</div>
                <p style={{ margin: '8px 0 4px 0', color: '#333' }}>
                    Clique aqui ou no botão acima
                </p>
                <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                    JPEG, PNG, GIF (max. 5MB)
                </p>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
        </div>
    );
};

export default ImageUpload;