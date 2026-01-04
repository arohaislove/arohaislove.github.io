[arohaislove.github.io](https://arohaislove.github.io/)
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MERGED Ticker Tape</title>
    <style>
        body {
            background: #0d1117;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            gap: 40px;
            font-family: system-ui, sans-serif;
        }
        h2 { color: #c9d1d9; margin: 0; }
        .dark-bg { background: #0d1117; padding: 10px; border-radius: 8px; }
        .light-bg { background: #fff; padding: 10px; border-radius: 8px; }
        svg { display: block; max-width: 100%; }
    </style>
</head>
<body>
    <h2>🌙 Dark Mode</h2>
    <div class="dark-bg">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 112" width="720" height="112">
            <style>
                .bg { fill: #0d1117; }
                .c0 { fill: #161b22; }
                .c1 { fill: #0e4429; }
                .c2 { fill: #006d32; }
                .c3 { fill: #26a641; }
                .c4 { fill: #39d353; }
                .text-cell { fill: #39d353; }
                @keyframes ticker {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-400px); }
                }
                .ticker-wrap { animation: ticker 5s linear infinite; }
            </style>
            <defs>
                <clipPath id="vp1"><rect x="0" y="0" width="720" height="112"/></clipPath>
                <g id="mt1">
                    <rect class="text-cell" x="0" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="0" y="22" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="0" y="36" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="0" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="0" y="64" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="0" y="78" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="0" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="12" y="22" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="24" y="36" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="36" y="22" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="48" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="48" y="22" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="48" y="36" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="48" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="48" y="64" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="48" y="78" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="48" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="72" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="84" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="96" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="108" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="72" y="22" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="72" y="36" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="72" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="84" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="96" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="72" y="64" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="72" y="78" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="72" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="84" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="96" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="108" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="132" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="144" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="156" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="132" y="22" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="168" y="22" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="132" y="36" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="168" y="36" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="132" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="144" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="156" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="132" y="64" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="156" y="64" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="132" y="78" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="168" y="78" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="132" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="168" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="204" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="216" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="228" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="240" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="192" y="22" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="192" y="36" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="192" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="228" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="240" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="192" y="64" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="240" y="64" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="192" y="78" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="240" y="78" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="204" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="216" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="228" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="240" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="264" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="276" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="288" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="300" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="264" y="22" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="264" y="36" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="264" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="276" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="288" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="264" y="64" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="264" y="78" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="264" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="276" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="288" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="300" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="324" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="336" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="348" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="324" y="22" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="360" y="22" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="324" y="36" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="360" y="36" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="324" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="360" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="324" y="64" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="360" y="64" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="324" y="78" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="360" y="78" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="324" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="336" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell" x="348" y="92" width="10" height="10" rx="2"/>
                </g>
                <g id="cr1">
                    <rect class="c1" x="0" y="0" width="10" height="10" rx="2"/>
                    <rect class="c3" x="12" y="0" width="10" height="10" rx="2"/>
                    <rect class="c0" x="24" y="0" width="10" height="10" rx="2"/>
                    <rect class="c2" x="36" y="0" width="10" height="10" rx="2"/>
                    <rect class="c4" x="48" y="0" width="10" height="10" rx="2"/>
                    <rect class="c1" x="60" y="0" width="10" height="10" rx="2"/>
                    <rect class="c0" x="72" y="0" width="10" height="10" rx="2"/>
                    <rect class="c3" x="84" y="0" width="10" height="10" rx="2"/>
                    <rect class="c2" x="96" y="0" width="10" height="10" rx="2"/>
                    <rect class="c4" x="108" y="0" width="10" height="10" rx="2"/>
                    <rect class="c0" x="120" y="0" width="10" height="10" rx="2"/>
                    <rect class="c1" x="132" y="0" width="10" height="10" rx="2"/>
                    <rect class="c3" x="144" y="0" width="10" height="10" rx="2"/>
                    <rect class="c2" x="156" y="0" width="10" height="10" rx="2"/>
                    <rect class="c0" x="168" y="0" width="10" height="10" rx="2"/>
                    <rect class="c4" x="180" y="0" width="10" height="10" rx="2"/>
                    <rect class="c1" x="192" y="0" width="10" height="10" rx="2"/>
                    <rect class="c2" x="204" y="0" width="10" height="10" rx="2"/>
                    <rect class="c3" x="216" y="0" width="10" height="10" rx="2"/>
                    <rect class="c0" x="228" y="0" width="10" height="10" rx="2"/>
                    <rect class="c4" x="240" y="0" width="10" height="10" rx="2"/>
                    <rect class="c1" x="252" y="0" width="10" height="10" rx="2"/>
                    <rect class="c0" x="264" y="0" width="10" height="10" rx="2"/>
                    <rect class="c2" x="276" y="0" width="10" height="10" rx="2"/>
                    <rect class="c3" x="288" y="0" width="10" height="10" rx="2"/>
                    <rect class="c4" x="300" y="0" width="10" height="10" rx="2"/>
                    <rect class="c0" x="312" y="0" width="10" height="10" rx="2"/>
                    <rect class="c1" x="324" y="0" width="10" height="10" rx="2"/>
                    <rect class="c2" x="336" y="0" width="10" height="10" rx="2"/>
                    <rect class="c3" x="348" y="0" width="10" height="10" rx="2"/>
                    <rect class="c4" x="360" y="0" width="10" height="10" rx="2"/>
                    <rect class="c0" x="372" y="0" width="10" height="10" rx="2"/>
                    <rect class="c1" x="384" y="0" width="10" height="10" rx="2"/>
                    <rect class="c2" x="396" y="0" width="10" height="10" rx="2"/>
                </g>
            </defs>
            <rect class="bg" width="720" height="112"/>
            <use href="#cr1" x="8" y="8"/><use href="#cr1" x="8" y="22"/><use href="#cr1" x="8" y="36"/>
            <use href="#cr1" x="8" y="50"/><use href="#cr1" x="8" y="64"/><use href="#cr1" x="8" y="78"/>
            <use href="#cr1" x="8" y="92"/><use href="#cr1" x="416" y="8"/><use href="#cr1" x="416" y="22"/>
            <use href="#cr1" x="416" y="36"/><use href="#cr1" x="416" y="50"/><use href="#cr1" x="416" y="64"/>
            <use href="#cr1" x="416" y="78"/><use href="#cr1" x="416" y="92"/>
            <g clip-path="url(#vp1)">
                <g class="ticker-wrap">
                    <use href="#mt1" x="0" y="0"/>
                    <use href="#mt1" x="400" y="0"/>
                    <use href="#mt1" x="800" y="0"/>
                </g>
            </g>
        </svg>
    </div>

    <h2>☀️ Light Mode</h2>
    <div class="light-bg">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 112" width="720" height="112">
            <style>
                .bg2 { fill: #ffffff; }
                .l0 { fill: #ebedf0; }
                .l1 { fill: #9be9a8; }
                .l2 { fill: #40c463; }
                .l3 { fill: #30a14e; }
                .l4 { fill: #216e39; }
                .text-cell2 { fill: #216e39; }
                @keyframes ticker2 {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-400px); }
                }
                .ticker-wrap2 { animation: ticker2 5s linear infinite; }
            </style>
            <defs>
                <clipPath id="vp2"><rect x="0" y="0" width="720" height="112"/></clipPath>
                <g id="mt2">
                    <rect class="text-cell2" x="0" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="0" y="22" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="0" y="36" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="0" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="0" y="64" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="0" y="78" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="0" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="12" y="22" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="24" y="36" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="36" y="22" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="48" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="48" y="22" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="48" y="36" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="48" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="48" y="64" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="48" y="78" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="48" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="72" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="84" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="96" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="108" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="72" y="22" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="72" y="36" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="72" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="84" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="96" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="72" y="64" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="72" y="78" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="72" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="84" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="96" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="108" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="132" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="144" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="156" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="132" y="22" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="168" y="22" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="132" y="36" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="168" y="36" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="132" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="144" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="156" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="132" y="64" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="156" y="64" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="132" y="78" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="168" y="78" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="132" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="168" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="204" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="216" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="228" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="240" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="192" y="22" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="192" y="36" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="192" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="228" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="240" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="192" y="64" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="240" y="64" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="192" y="78" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="240" y="78" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="204" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="216" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="228" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="240" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="264" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="276" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="288" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="300" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="264" y="22" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="264" y="36" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="264" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="276" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="288" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="264" y="64" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="264" y="78" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="264" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="276" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="288" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="300" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="324" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="336" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="348" y="8" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="324" y="22" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="360" y="22" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="324" y="36" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="360" y="36" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="324" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="360" y="50" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="324" y="64" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="360" y="64" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="324" y="78" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="360" y="78" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="324" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="336" y="92" width="10" height="10" rx="2"/>
                    <rect class="text-cell2" x="348" y="92" width="10" height="10" rx="2"/>
                </g>
                <g id="cr2">
                    <rect class="l1" x="0" y="0" width="10" height="10" rx="2"/>
                    <rect class="l3" x="12" y="0" width="10" height="10" rx="2"/>
                    <rect class="l0" x="24" y="0" width="10" height="10" rx="2"/>
                    <rect class="l2" x="36" y="0" width="10" height="10" rx="2"/>
                    <rect class="l4" x="48" y="0" width="10" height="10" rx="2"/>
                    <rect class="l1" x="60" y="0" width="10" height="10" rx="2"/>
                    <rect class="l0" x="72" y="0" width="10" height="10" rx="2"/>
                    <rect class="l3" x="84" y="0" width="10" height="10" rx="2"/>
                    <rect class="l2" x="96" y="0" width="10" height="10" rx="2"/>
                    <rect class="l4" x="108" y="0" width="10" height="10" rx="2"/>
                    <rect class="l0" x="120" y="0" width="10" height="10" rx="2"/>
                    <rect class="l1" x="132" y="0" width="10" height="10" rx="2"/>
                    <rect class="l3" x="144" y="0" width="10" height="10" rx="2"/>
                    <rect class="l2" x="156" y="0" width="10" height="10" rx="2"/>
                    <rect class="l0" x="168" y="0" width="10" height="10" rx="2"/>
                    <rect class="l4" x="180" y="0" width="10" height="10" rx="2"/>
                    <rect class="l1" x="192" y="0" width="10" height="10" rx="2"/>
                    <rect class="l2" x="204" y="0" width="10" height="10" rx="2"/>
                    <rect class="l3" x="216" y="0" width="10" height="10" rx="2"/>
                    <rect class="l0" x="228" y="0" width="10" height="10" rx="2"/>
                    <rect class="l4" x="240" y="0" width="10" height="10" rx="2"/>
                    <rect class="l1" x="252" y="0" width="10" height="10" rx="2"/>
                    <rect class="l0" x="264" y="0" width="10" height="10" rx="2"/>
                    <rect class="l2" x="276" y="0" width="10" height="10" rx="2"/>
                    <rect class="l3" x="288" y="0" width="10" height="10" rx="2"/>
                    <rect class="l4" x="300" y="0" width="10" height="10" rx="2"/>
                    <rect class="l0" x="312" y="0" width="10" height="10" rx="2"/>
                    <rect class="l1" x="324" y="0" width="10" height="10" rx="2"/>
                    <rect class="l2" x="336" y="0" width="10" height="10" rx="2"/>
                    <rect class="l3" x="348" y="0" width="10" height="10" rx="2"/>
                    <rect class="l4" x="360" y="0" width="10" height="10" rx="2"/>
                    <rect class="l0" x="372" y="0" width="10" height="10" rx="2"/>
                    <rect class="l1" x="384" y="0" width="10" height="10" rx="2"/>
                    <rect class="l2" x="396" y="0" width="10" height="10" rx="2"/>
                </g>
            </defs>
            <rect class="bg2" width="720" height="112"/>
            <use href="#cr2" x="8" y="8"/><use href="#cr2" x="8" y="22"/><use href="#cr2" x="8" y="36"/>
            <use href="#cr2" x="8" y="50"/><use href="#cr2" x="8" y="64"/><use href="#cr2" x="8" y="78"/>
            <use href="#cr2" x="8" y="92"/><use href="#cr2" x="416" y="8"/><use href="#cr2" x="416" y="22"/>
            <use href="#cr2" x="416" y="36"/><use href="#cr2" x="416" y="50"/><use href="#cr2" x="416" y="64"/>
            <use href="#cr2" x="416" y="78"/><use href="#cr2" x="416" y="92"/>
            <g clip-path="url(#vp2)">
                <g class="ticker-wrap2">
                    <use href="#mt2" x="0" y="0"/>
                    <use href="#mt2" x="400" y="0"/>
                    <use href="#mt2" x="800" y="0"/>
                </g>
            </g>
        </svg>
    </div>
</body>
</html>

