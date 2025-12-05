import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Loader2 } from 'lucide-react';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    isParsing: boolean;
    accept?: string;
}

export function FileUpload({ onFileSelect, isParsing, accept = "image/*,application/pdf" }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fake progress animation
    useEffect(() => {
        if (!isParsing) {
            setProgress(0);
            return;
        }

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return prev; // Stop at 90% until complete
                // Slow down as it gets higher
                const increment = prev < 30 ? 5 : prev < 60 ? 2 : 0.5;
                return Math.min(prev + increment, 90);
            });
        }, 100);

        return () => clearInterval(interval);
    }, [isParsing]);

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
            className={`relative w-full py-8 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center gap-3 touch-manipulation ${isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                } ${isParsing ? 'opacity-100 cursor-not-allowed bg-gray-50' : 'cursor-pointer active:scale-[0.98]'}`}
        >
            {isParsing ? (
                <div className="flex flex-col items-center gap-3 w-full max-w-[200px] pointer-events-none select-none">
                    <div className="flex items-center gap-2 text-blue-600">
                        <div className="animate-spin">
                            <Loader2 className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-sm">일정 분석 중... {Math.round(progress)}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center pointer-events-none select-none w-full">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                        <Upload className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="text-center px-4">
                        <p className="text-sm font-medium text-gray-700 break-keep">클릭하여 이미지/PDF 업로드</p>
                        <p className="text-xs text-gray-400 mt-1 hidden sm:block">또는 파일을 여기로 드래그하세요</p>
                    </div>
                </div>
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
