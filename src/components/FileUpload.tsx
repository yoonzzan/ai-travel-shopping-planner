import { useState, useRef, useCallback } from 'react';
import { Upload, Loader2 } from 'lucide-react';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    isParsing: boolean;
    accept?: string;
}

export function FileUpload({ onFileSelect, isParsing, accept = "image/*,application/pdf" }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Check if the drag event is coming from outside the component
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;

        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Check if the drag event is leaving to outside the component
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;

        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        if (!isDragging) setIsDragging(true);
    }, [isDragging]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (isParsing) return;

        const file = e.dataTransfer.files?.[0];
        if (file) {
            onFileSelect(file);
        }
    }, [isParsing, onFileSelect]);

    const handleClick = () => {
        if (!isParsing) fileInputRef.current?.click();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onFileSelect(file);
    };

    return (
        <div
            onClick={handleClick}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`relative w-full py-8 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center gap-3 ${isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                } ${isParsing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            {isParsing ? (
                <div className="flex items-center gap-3 text-blue-600 pointer-events-none">
                    <div className="animate-spin">
                        <Loader2 className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-lg">일정 분석 중...</span>
                </div>
            ) : (
                <>
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center pointer-events-none">
                        <Upload className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="text-center pointer-events-none">
                        <p className="text-sm font-medium text-gray-700">클릭하여 이미지/PDF 업로드</p>
                        <p className="text-xs text-gray-400 mt-1">또는 파일을 여기로 드래그하세요</p>
                    </div>
                </>
            )}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleInputChange}
                accept={accept}
                style={{ display: 'none' }}
            />
        </div>
    );
}
