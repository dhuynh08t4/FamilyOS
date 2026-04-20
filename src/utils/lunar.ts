/**
 * Vietnamese Lunar Calendar implementation based on Hồ Ngọc Đức's algorithm.
 */

export interface LunarDate {
    day: number;
    month: number;
    year: number;
    leap: boolean;
}

export interface SolarDate {
    day: number;
    month: number;
    year: number;
}

function jdFromDate(d: number, m: number, y: number): number {
    let a = Math.floor((14 - m) / 12);
    let year = y + 4800 - a;
    let month = m + 12 * a - 3;
    let jd = d + Math.floor((153 * month + 2) / 5) + 365 * year + Math.floor(year / 4) - Math.floor(year / 100) + Math.floor(year / 400) - 32045;
    if (jd < 2299161) {
        jd = d + Math.floor((153 * month + 2) / 5) + 365 * year + Math.floor(year / 4) - 32083;
    }
    return jd;
}

function dateFromJd(jd: number): SolarDate {
    let b = 0;
    let c = 0;
    if (jd > 2299160) {
        let a = Math.floor((jd - 1867216.25) / 36524.25);
        b = jd + 1 + a - Math.floor(a / 4);
    } else {
        b = jd;
    }
    c = b + 1524;
    let d = Math.floor((c - 122.1) / 365.25);
    let e = 365 * d + Math.floor(d / 4);
    let f = Math.floor((c - e) / 30.6001);
    let day = c - e - Math.floor(30.6001 * f);
    let month = f - (f > 13 ? 13 : 1);
    let year = d - (month > 2 ? 4716 : 4715);
    return { day, month, year };
}

function getSunLongitude(jdn: number): number {
    const t = (jdn - 2451545.0) / 36525.0;
    let l = 280.46646 + 36000.76983 * t + 0.0003032 * t * t;
    l = l % 360;
    if (l < 0) l += 360;
    let m = 357.52911 + 35999.05029 * t - 0.0001537 * t * t;
    m = m % 360;
    if (m < 0) m += 360;
    const c = (1.914602 - 0.004817 * t - 0.000014 * t * t) * Math.sin(m * Math.PI / 180) +
        (0.019993 - 0.000101 * t) * Math.sin(2 * m * Math.PI / 180) +
        0.000289 * Math.sin(3 * m * Math.PI / 180);
    let lambda = l + c;
    return lambda;
}

function getNewMoon(k: number): number {
    const t = k / 1236.85;
    const t2 = t * t;
    const t3 = t2 * t;
    const dr = 2451550.09765 + 29.530588853 * k + 0.0001337 * t2 - 0.00000015 * t3 +
        0.00073 * Math.sin((166.56 + 132.87 * t - 0.009173 * t2) * Math.PI / 180);
    const m = (2.1 + 29.10535608 * k - 0.000037 * t2 - 0.0000001 * t3) * Math.PI / 180;
    const mprime = (160.2261 + 390.67050274 * k + 0.010174 * t2 - 0.000012 * t3) * Math.PI / 180;
    const f = (160.9612 + 390.67050274 * k - 0.003612 * t2 + 0.000006 * t3) * Math.PI / 180;
    const p = dr + (0.1734 - 0.000393 * t) * Math.sin(m) +
        0.0021 * Math.sin(2 * m) - 0.4068 * Math.sin(mprime) +
        0.0161 * Math.sin(2 * mprime) - 0.0004 * Math.sin(3 * mprime) +
        0.0104 * Math.sin(2 * f) - 0.0051 * Math.sin(m + mprime) -
        0.0074 * Math.sin(m - mprime) + 0.0004 * Math.sin(2 * f + m) -
        0.0004 * Math.sin(2 * f - m) - 0.0006 * Math.sin(2 * f + mprime) +
        0.0010 * Math.sin(2 * f - mprime) + 0.0005 * Math.sin(m + 2 * mprime);
    return p;
}

function getNewMoonDay(k: number, timezone: number): number {
    return Math.floor(getNewMoon(k) + timezone / 24 + 0.5);
}

function getLunarMonth11(year: number, timezone: number): number {
    const off = Math.floor((year - 2000) * 12.3685);
    let k = off - 2;
    while (true) {
        const jdn = getNewMoonDay(k, timezone);
        const sunLong = getSunLongitude(jdn);
        if (sunLong >= 240 && sunLong <= 300) break;
        k++;
    }
    return k;
}

function getLeapMonthOffset(a11: number, timezone: number): number {
    let k = a11;
    let lastSunLong = Math.floor(getSunLongitude(getNewMoonDay(k, timezone)) / 30);
    for (let i = 1; i <= 12; i++) {
        k++;
        const jdn = getNewMoonDay(k, timezone);
        const sunLong = Math.floor(getSunLongitude(jdn) / 30);
        if (sunLong === lastSunLong) return k;
        lastSunLong = sunLong;
    }
    return -1;
}

export function getLunarDate(dd: number, mm: number, yy: number): LunarDate {
    const timezone = 7;
    const day = Math.floor(jdFromDate(dd, mm, yy));
    let k = Math.floor((yy - 2000) * 12.3685) - 2;
    while (getNewMoonDay(k, timezone) <= day) k++;
    k--;
    const nm3 = getNewMoonDay(k, timezone);
    const lunarDay = day - nm3 + 1;

    let a11 = getLunarMonth11(yy, timezone);
    if (day < getNewMoonDay(a11, timezone)) a11 = getLunarMonth11(yy - 1, timezone);

    const leapMonthConfig = getLeapMonthOffset(a11, timezone);
    let mCount = k - a11;
    const isLeap = (leapMonthConfig !== -1 && k === leapMonthConfig);
    if (leapMonthConfig !== -1 && k > leapMonthConfig) mCount--;
    const m = (mCount + 10) % 12 + 1;
    
    // Simplifed year logic
    let lunarYear = yy;
    if (m >= 11 && mm < 6) lunarYear = yy - 1;
    if (m <= 2 && mm > 10) lunarYear = yy + 1;

    return { day: lunarDay, month: m, year: lunarYear, leap: isLeap };
}

export function getSolarDate(lDay: number, lMonth: number, lYear: number, isLeapMonth: boolean = false): SolarDate {
    const timezone = 7;
    let a11 = getLunarMonth11(lMonth >= 11 ? lYear : lYear - 1, timezone);
    const leapMod = getLeapMonthOffset(a11, timezone);
    
    let k = a11 + lMonth - 11;
    if (lMonth < 11) k += 12;
    
    if (leapMod !== -1 && (k > leapMod || (k === leapMod && !isLeapMonth))) {
        k++;
    }
    
    const jd = getNewMoonDay(k, timezone) + lDay - 1;
    return dateFromJd(jd);
}

export function getDaysInLunarMonth(lMonth: number, lYear: number): number {
    // A lunar month is the period between two new moons, either 29 or 30 days.
    const s30 = getSolarDate(30, lMonth, lYear);
    const backToLunar = getLunarDate(s30.day, s30.month, s30.year);
    if (backToLunar.day === 30 && backToLunar.month === lMonth) return 30;
    return 29;
}

export function formatLunarDate(lunar: LunarDate): string {
    return `${lunar.day}/${lunar.month}${lunar.leap ? ' (Nhuận)' : ''}`;
}
