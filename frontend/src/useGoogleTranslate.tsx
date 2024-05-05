import React, {useState, ReactNode, CSSProperties, FC, useEffect } from 'react';

const getRegionFromCoordinates = (lat : number, long : number) => {
    const regions = {
        SA: {lat: -8.7832, long: 55.4915},
        NA: {lat: 54.5260, long: 105.2551}
    }

    const closestRegion = Object.entries(regions).reduce((acc, [key, value]) => {
        const dist = ((value.lat-lat)^2 + (long-value.long)^2)^(0.5)

        return dist > acc.dist ? acc : {dist: dist, name: key} ;
    }, {dist: 10000000, name: ""});

    return closestRegion
}

function fetchGeolocation(callback : Function) {
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;

            // Process the coordinates or call the callback
            callback(latitude, longitude);
        },
        error => {
            console.error("Error getting location", error);
            // Handle error or call callback with default values
            callback(null, null);
        }
    );
}

function useGoogleTranslateScript() {
    const [locationFetched, setLocationFetched] = useState(false);
    const [location, setLocation] = useState({ latitude: 29, longitude: -94 });

    useEffect(() => {
        if (!locationFetched) {
            fetchGeolocation((lat : number, long : number) => {
                setLocation({ latitude: lat, longitude: long });
                setLocationFetched(true);
            });
        }
    }, [locationFetched]);

    useEffect(() => {
            // Check if the widget has already been initialized to avoid duplicates
        if ((window as any).google && (window as any).google.translate && (window as any).google.translate.TranslateElement) {
            return; // If the widget is already initialized, exit the function
        }

        const scriptId = 'google-translate-script';
        const addScript = document.createElement('script');
        addScript.id = scriptId;
        addScript.setAttribute(
            'src',
            '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
        );
        document.body.appendChild(addScript);

        (window as any).googleTranslateElementInit = () => {
            new (window as any).google.translate.TranslateElement(
                {
                    pageLanguage: 'en',
                    includedLanguages: 'en,es',
                },
                'google_translate_element'
            );
        };

        var selectField = document.querySelector(".goog-te-combo") as HTMLSelectElement;
        if (selectField && locationFetched) {
            const region = getRegionFromCoordinates(location.latitude, location.longitude)
            if (region.name === "SA"){
                selectField.value = 'es';
            }else{
                selectField.value = 'es';
            }

            selectField.dispatchEvent(new Event('change'));
        }

        return () => {
            const script = document.getElementById(scriptId);
            if (script) {
              document.body.removeChild(script);
            }
            // Remove the translate element
            const translateEl = document.getElementById('google_translate_element');
            if (translateEl) {
              translateEl.remove();
            }
            // Reset the init function
            (window as any).googleTranslateElementInit = undefined;
        };
    }, []);
}


export default useGoogleTranslateScript