import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import guideData from '../../data/guide_recommendations.json';

interface CityTagInputProps {
    value: string[];
    onChange: (cities: string[]) => void;
    placeholder?: string;
}

export function CityTagInput({ value, onChange, placeholder }: CityTagInputProps) {
    const [input, setInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Memoize cities data to ensure it updates if guideData changes (though usually requires reload)
    const availableCities = useMemo(() => (guideData as any).recommendations.map((rec: any) => ({
        name: rec.city,
        country: rec.country,
        searchTerms: rec.searchTerms || []
    })), []);

    const filteredSuggestions = useMemo(() => {
        if (!input.trim()) return [];

        const matches = availableCities.filter((city: any) =>
            city.searchTerms.some((term: string) =>
                term.normalize('NFC').toLowerCase().includes(input.normalize('NFC').toLowerCase())
            ) &&
            !value.includes(city.name)
        );

        console.log('Searching for:', input, 'Matches:', matches.length);
        return matches;
    }, [input, availableCities, value]);

    const addCity = (cityName: string) => {
        if (!value.includes(cityName)) {
            onChange([...value, cityName]);
        }
        setInput('');
        setShowSuggestions(false);
    };

    const removeCity = (cityName: string) => {
        onChange(value.filter(c => c !== cityName));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.nativeEvent.isComposing) return; // Fix IME double submission

        if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredSuggestions.length > 0) {
                addCity(filteredSuggestions[0].name);
            } else if (input.trim()) {
                // Allow custom cities (e.g. Shanghai) if explicitly entered
                addCity(input.trim());
            }
        } else if (e.key === 'Backspace' && !input && value.length > 0) {
            removeCity(value[value.length - 1]);
        }
    };

    const handleBlur = () => {
        if (filteredSuggestions.length > 0) {
            addCity(filteredSuggestions[0].name);
        }
        setTimeout(() => setShowSuggestions(false), 200);
    };

    return (
        <div className={`relative ${showSuggestions ? 'z-50' : ''}`}>
            <div className="w-full px-4 py-3 min-h-[60px] bg-gray-50 border-2 border-transparent rounded-xl focus-within:bg-white focus-within:border-blue-500 focus-within:ring-0 transition-all flex flex-wrap items-center gap-2">
                {value.map((city) => (
                    <span key={city} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 animate-fade-in">
                        {city}
                        <button onClick={() => removeCity(city)} className="hover:text-blue-900">
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent outline-none min-w-[100px] text-lg placeholder-gray-400"
                    placeholder={value.length === 0 ? placeholder : ""}
                />
            </div>

            {/* Autocomplete Suggestions */}
            {showSuggestions && input.trim() && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-h-60 overflow-y-auto">
                    {filteredSuggestions.map((city: any) => (
                        <button
                            key={city.name}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => addCity(city.name)}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center justify-between group"
                        >
                            <div>
                                <span className="font-medium text-gray-900">{city.name}</span>
                                <span className="text-sm text-gray-500 ml-2">{city.country}</span>
                            </div>
                            <span className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">선택</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
