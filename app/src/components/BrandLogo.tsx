'use client';

type BrandLogoProps = {
  dark?: boolean;
  width?: number;
};

export default function BrandLogo({ dark = false, width = 200 }: BrandLogoProps) {
  return (
    <img
      src="/brand_logo.jpeg"
      width={width}
      height={width}
      alt="FrieghtIQ logo"
      style={{ display: 'block', width, height: width, objectFit: 'contain' }}
    />
  );
}