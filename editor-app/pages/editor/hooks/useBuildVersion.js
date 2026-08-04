import {useState, useEffect} from 'react';

export function useBuildVersion(isDirty) {
    const [buildId, setBuildId] = useState(null);
    const [buildOutdated, setBuildOutdated] = useState(false);

    useEffect(() => {
        let cancelled = false;
        let timer;
        const tick = async () => {
            try {
                const r = await fetch('/api/editor/version', {cache: 'no-store'});
                if (!r.ok) return;
                const {version} = await r.json();
                if (cancelled || !version) return;
                setBuildId((prev) => {
                    if (prev == null) return version;
                    if (prev !== version) setBuildOutdated(true);
                    return prev;
                });
            } catch {
            }
        };
        tick();
        timer = setInterval(tick, 4000);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, []);

    useEffect(() => {
        if (buildOutdated && !isDirty) {
            window.location.reload();
        }
    }, [buildOutdated, isDirty]);

    return {buildOutdated};
}
