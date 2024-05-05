import React, { useEffect, useState } from 'react';
import { animated, useSpring } from '@react-spring/web';

interface ImageProps {
  x: number;
  y: number;
  step: number;
}

function MovingImage({ x, y, step }: ImageProps) {
  const styles = useSpring({
    from: { x: x, y: y },

    to: async (next) => {
      while (1) {
        await next({ x: x + step, y: y + step });
        await next({ x: x, y: y, immediate: true });
      }
    },

    config: { duration: 2000 },
  });

  return (
    <animated.div style={{position: 'fixed', zIndex: -1, transform: styles.x.to((x) => `translate(${x}px, ${styles.y.get()}px)`)}}>
      <img
        className="bg-home-page-bg-image"
        src="/background_img.png"
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          width: "100px",
          opacity: 0.1,
          rotate: "-30deg",
          zIndex: -1
        }}

        alt="moving section for background"
      />
    </animated.div>
  );
}

function HomePageBackground() {
  const [images, setImages] = useState<ImageProps[]>([]);

  useEffect(() => {
    const generateGridPositions = () => {
      const positions: ImageProps[] = [];
      const numRows = 8;
      const numColumns = 16;
      const imgSize = 125;

      for (let row = -1; row < numRows; row++) {
        for (let col = -1; col < numColumns; col++) {
          positions.push({
            x: (col * imgSize),
            y: (row * imgSize),
            step: imgSize
          });
        }
      }
      setImages(positions);
    };

    generateGridPositions();
  }, []);

  return (
    <div className='home-page-background-container' style={{position: "absolute", overflow: "hidden", zIndex: 0}}>
      <div className='home-page-background'>
        {images.map((image, index) => (
          <MovingImage key={index} {...image}></MovingImage>
        ))}
      </div>
    </div>
  );
}

export default HomePageBackground;