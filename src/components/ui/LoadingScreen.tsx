import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface LoadingScreenProps {
    destination: string;
}

export function LoadingScreen({ destination }: LoadingScreenProps) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) {
                    clearInterval(timer);
                    return 95;
                }
                // Random increment between 1 and 5
                return Math.min(prev + Math.floor(Math.random() * 5) + 1, 95);
            });
        }, 150);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto">
            <div className="relative w-32 h-32 mb-8">
                {/* Outer Ring */}
                <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                {/* Spinning Ring */}
                <div
                    className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"
                    style={{ animationDuration: '2s' }}
                ></div>
                {/* Center Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center animate-pulse">
                        <Sparkles className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-3">AI가 열심히 분석 중입니다</h2>
            <p className="text-gray-500 leading-relaxed mb-8">
                {destination ? destination : '여행지'}의 쇼핑 트렌드와<br />
                사용자님의 취향을 매칭하고 있어요
            </p>

            {/* Percentage Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden relative">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <div className="mt-3 font-bold text-blue-600 text-lg">
                {progress}%
            </div>
        </div>
    );
}
