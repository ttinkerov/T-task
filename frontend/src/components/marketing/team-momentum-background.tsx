'use client';

export function TeamMomentumBackground() {
  return (
    <div className="team-bg" aria-hidden="true">
      <div className="team-bg__base" />
      <div className="team-bg__grid" />
      <div className="team-bg__orb team-bg__orb--1" />
      <div className="team-bg__orb team-bg__orb--2" />
      <div className="team-bg__orb team-bg__orb--3" />
      <div className="team-bg__beam" />

      <div className="team-bg__card team-bg__card--1">
        <span />
        <span />
        <span />
      </div>
      <div className="team-bg__card team-bg__card--2">
        <span />
        <span />
      </div>
      <div className="team-bg__card team-bg__card--3">
        <span />
        <span />
        <span />
      </div>

      <div className="team-bg__progress">
        <div className="team-bg__progress-bar" />
        <div className="team-bg__progress-bar team-bg__progress-bar--delay" />
        <div className="team-bg__progress-bar team-bg__progress-bar--delay-2" />
      </div>
    </div>
  );
}
