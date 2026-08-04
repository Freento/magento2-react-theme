export default function ImageBlock({
  src = '',
  mobileSrc = '',
  alt = '',
  objectFit = 'cover',
  objectPosition = 'center center',
  borderRadius = '0',
  loadOnHover = false,
  priority = false,
  lazy = !priority || loadOnHover,
}) {
  const imgStyle = {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit,
    objectPosition,
    borderRadius,
  };
  const img = (
    <img
      src={src}
      alt={alt}
      loading={lazy ? 'lazy' : 'eager'}
      decoding={lazy ? 'async' : undefined}
      fetchpriority={priority ? 'high' : undefined}
      style={imgStyle}
    />
  );

  if (mobileSrc) {
    return (
      <picture>
        <source media="(max-width: 640px)" srcSet={mobileSrc} />
        {img}
      </picture>
    );
  }
  return img;
}
