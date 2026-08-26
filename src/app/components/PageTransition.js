"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function PageTransition({ children }) {

  const pathname = usePathname();

  /* disable loader for login pages */
  const NO_LOADER_ROUTES = [
    "/",
    "/auth/login",
    "/signin"
  ];

  const disableLoader =
    NO_LOADER_ROUTES.includes(pathname);


  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);


  useEffect(() => {

    if (disableLoader) {

      setLoading(false);
      setProgress(0);

      document.body.style.overflow = "auto";

      return;

    }


    setLoading(true);
    setProgress(15);

    document.body.style.overflow = "hidden";


    const interval = setInterval(() => {

      setProgress(prev => {

        if (prev >= 90) return prev;

        return prev + 6;

      });

    }, 120);


    const timer = setTimeout(() => {

      setProgress(100);

      setTimeout(() => {

        setLoading(false);
        setProgress(0);

        document.body.style.overflow = "auto";

      }, 200);

    }, 600);


    return () => {

      clearInterval(interval);
      clearTimeout(timer);

    };

  }, [pathname, disableLoader]);



  return (

    <div className="relative">

      {

        loading && !disableLoader && (

          <div className="fixed top-[80px] left-0 w-full z-50">

            <div
              className="h-[3px] transition-all duration-200"
              style={{

                width: `${progress}%`,

                background:
                  "linear-gradient(90deg,#fde68a,#93c5fd,#86efac,#fca5a5,#fde68a)",

                backgroundSize: "300% 100%",

                animation: "softColorLoader 1.4s linear infinite"

              }}
            />

          </div>

        )

      }


      {children}

    </div>

  );

}
