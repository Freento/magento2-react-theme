import {useState, useRef, useCallback, useEffect} from 'react';

export function useToast() {
    const [toast, setToast] = useState(null);
    const toastTimerRef = useRef(null);
    const showToast = useCallback((message, type = 'info', durationMs = 4000) => {
        setToast({message, type});
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast(null), durationMs);
    }, []);
    const dismissToast = useCallback(() => {
        setToast(null);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    }, []);
    useEffect(() => () => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    }, []);
    return {toast, showToast, dismissToast};
}
