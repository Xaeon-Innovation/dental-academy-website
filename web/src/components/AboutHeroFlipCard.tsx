"use client";

import Image from "next/image";
import styles from "./AboutHeroFlipCard.module.css";

export function AboutHeroFlipCard() {
  return (
    <div className={styles.card}>
      <div className={styles.cardInner}>
        <div className={styles.cardFront}>
          <Image
            src="/images/about-hero-team.png"
            alt="Kaleidoscope Dental Academy team: Dr. Sherif Elbahrawy, Dr. Mina Wahba, and Dr. Ahmed Hely in the clinic"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </div>
        <div className={styles.cardBack}>
          <Image
            src="/images/about-hero-logo.png"
            alt="Kaleidoscope Dental Academy logo"
            fill
            className="object-contain p-6"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </div>
    </div>
  );
}
