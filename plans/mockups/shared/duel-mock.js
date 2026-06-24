const sceneMarkup = `
  <div class="phone">
    <div class="screen">
      <svg id="scene" viewBox="0 0 360 740" preserveAspectRatio="xMidYMid slice">
        <rect class="bg-wash" width="360" height="740"/>

        <defs>
          <g id="field">
            <rect class="cell" x="18"  y="410" width="100" height="100" rx="14"/>
            <rect class="cell" x="126" y="410" width="100" height="100" rx="14"/>
            <rect class="cell" x="234" y="410" width="100" height="100" rx="14"/>
            <rect class="cell" x="18"  y="518" width="100" height="100" rx="14"/>
            <rect class="cell" x="126" y="518" width="100" height="100" rx="14"/>
            <rect class="cell" x="234" y="518" width="100" height="100" rx="14"/>
            <rect class="cell" x="18"  y="626" width="100" height="100" rx="14"/>
            <rect class="cell" x="126" y="626" width="100" height="100" rx="14"/>
            <rect class="cell" x="234" y="626" width="100" height="100" rx="14"/>

            <g class="breathe">
              <circle class="target" cx="68" cy="460" r="32"/>
              <circle class="target-core" cx="68" cy="460" r="6"/>
            </g>

            <circle class="ripple" cx="176" cy="460" r="22"/>
            <text class="score-pop display-text" x="176" y="448" text-anchor="middle">+1</text>

            <g class="expiring">
              <circle class="target" cx="68" cy="568" r="32"/>
              <circle class="target-ring" cx="68" cy="568" r="24"/>
              <text class="tap-count display-text" x="68" y="577" text-anchor="middle">2</text>
            </g>

            <g class="breathe">
              <circle class="target" cx="284" cy="568" r="32"/>
              <circle class="target-ring" cx="284" cy="568" r="24"/>
              <text class="tap-count display-text" x="284" y="577" text-anchor="middle">3</text>
            </g>

            <g>
              <circle class="bomb-body" cx="176" cy="676" r="28"/>
              <line class="bomb-x" x1="165" y1="665" x2="187" y2="687"/>
              <line class="bomb-x" x1="187" y1="665" x2="165" y2="687"/>
              <path class="bomb-fuse" d="M176,648 q4,-10 13,-9"/>
              <circle class="bomb-spark" cx="191" cy="638" r="3"/>
            </g>
          </g>
        </defs>

        <g class="slot-divider">
          <rect class="divider-band" x="0" y="365" width="360" height="10"/>
          <line class="divider-line" x1="0" y1="365" x2="360" y2="365"/>
          <line class="divider-line" x1="0" y1="375" x2="360" y2="375"/>
        </g>

        <g class="field-p2"><use href="#field"/></g>
        <g class="field-p1" transform="rotate(180 180 370)"><use href="#field"/></g>

        <g class="slot-hud-p2">
          <text class="hud-label body-text" x="18" y="399">SCORE</text>
          <text class="hud-value score-p2 display-text" x="64" y="400">12</text>
          <text class="hud-label body-text" x="272" y="399">TIME</text>
          <text class="hud-value hud-time display-text" x="308" y="400">0:37</text>
        </g>

        <g class="slot-hud-p1" transform="rotate(180 180 370)">
          <text class="hud-label body-text" x="18" y="399">SCORE</text>
          <text class="hud-value score-p1 display-text" x="64" y="400">9</text>
          <text class="hud-label body-text" x="272" y="399">TIME</text>
          <text class="hud-value hud-time display-text" x="308" y="400">0:37</text>
        </g>

        <g class="annot">
          <line class="leader" x1="150" y1="60" x2="120" y2="40"/>
          <g transform="translate(16,34)"><rect class="label-bg" x="0" y="-11" width="186" height="16" rx="8"/><text class="label-tag" x="7" y="1">P1 half - whole UI rotated 180 deg</text></g>

          <g transform="translate(104,338)"><rect class="label-bg" x="0" y="-11" width="188" height="16" rx="8"/><text class="label-tag" x="7" y="1">mirrored spawns - both halves identical</text></g>

          <line class="leader" x1="45" y1="395" x2="92" y2="376"/>
          <g transform="translate(96,372)"><rect class="label-bg" x="0" y="-11" width="166" height="16" rx="8"/><text class="label-tag" x="7" y="1">score &amp; time - read toward you</text></g>

          <line class="leader" x1="92" y1="448" x2="104" y2="438"/>
          <g transform="translate(100,432)"><rect class="label-bg" x="0" y="-11" width="160" height="16" rx="8"/><text class="label-tag" x="7" y="1">tap before it vanishes - +1</text></g>

          <line class="leader" x1="68" y1="601" x2="56" y2="612"/>
          <g transform="translate(24,618)"><rect class="label-bg" x="0" y="-11" width="152" height="16" rx="8"/><text class="label-tag" x="7" y="1">blinking = about to vanish</text></g>

          <line class="leader" x1="254" y1="554" x2="288" y2="546"/>
          <g transform="translate(116,540)"><rect class="label-bg" x="0" y="-11" width="176" height="16" rx="8"/><text class="label-tag" x="7" y="1">number = taps still needed - +3</text></g>

          <line class="leader" x1="180" y1="705" x2="196" y2="716"/>
          <g transform="translate(196,722)"><rect class="label-bg" x="0" y="-11" width="158" height="16" rx="8"/><text class="label-tag" x="7" y="1">bomb - tap = -3 + 1s stun</text></g>
        </g>
      </svg>
    </div>
  </div>
`;

export function renderDuelMock({ title, kicker, caption }) {
  const compact = new URLSearchParams(window.location.search).has('compact');
  if (compact) {
    document.body.classList.add('compact-preview');
    document.body.innerHTML = sceneMarkup;
    return;
  }

  document.body.innerHTML = `
    <div class="title">${title}<small>${kicker}</small></div>
    ${sceneMarkup}
    <div class="controls">
      <a class="btn" href="style-gallery.html">Gallery</a>
      <button class="btn" id="toggle">Hide labels</button>
    </div>
    <p class="caption">${caption}</p>
  `;

  const scene = document.getElementById('scene');
  const toggle = document.getElementById('toggle');
  toggle.addEventListener('click', () => {
    scene.classList.toggle('labels-off');
    toggle.textContent = scene.classList.contains('labels-off') ? 'Show labels' : 'Hide labels';
  });
}
