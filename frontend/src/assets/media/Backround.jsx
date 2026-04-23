function BackgroundMain() {
  return (
    <div aria-hidden="true" style={styles.root}>
      <div style={styles.lightWash} />
      <div style={styles.topShape} />
      <div style={styles.bottomShape} />
      <div style={styles.sideGlow} />
    </div>
  )
}

const styles = {
  root: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 0,
    background:
      'linear-gradient(180deg, rgba(242, 247, 252, 0.98) 0%, rgba(227, 237, 248, 1) 100%)',
  },
  lightWash: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(160deg, rgba(31, 78, 140, 0.06) 0%, rgba(31, 78, 140, 0) 52%)',
  },
  topShape: {
    position: 'absolute',
    top: '-22%',
    left: '-14%',
    width: '82%',
    height: '54%',
    borderRadius: '50%',
    background:
      'radial-gradient(circle at center, rgba(185, 206, 230, 0.55) 0%, rgba(185, 206, 230, 0) 72%)',
  },
  bottomShape: {
    position: 'absolute',
    right: '-20%',
    bottom: '-28%',
    width: '78%',
    height: '56%',
    borderRadius: '50%',
    background:
      'radial-gradient(circle at center, rgba(173, 198, 225, 0.48) 0%, rgba(173, 198, 225, 0) 74%)',
  },
  sideGlow: {
    position: 'absolute',
    top: '8%',
    right: '-14%',
    width: '52%',
    height: '62%',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(31, 78, 140, 0.14) 0%, rgba(31, 78, 140, 0) 74%)',
    filter: 'blur(2px)',
  },
}

export default BackgroundMain
