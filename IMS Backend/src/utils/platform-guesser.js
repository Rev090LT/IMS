// IMS/server/src/utils/platform-guesser.js

/**
 * Угадывает платформу по марке, модели и году
 * Точность: ~70-80% для масс-маркета
 * 
 * @param {string} brand 
 * @param {string} model 
 * @param {number} year 
 * @returns {string|null} platform_code
 */
export function guessPlatform(brand, model, year) {
  if (!brand || !model) return null;
  
  const b = (brand || '').toLowerCase().trim();
  const m = (model || '').toLowerCase().trim();
  const y = parseInt(year) || 0;
  
  // ===== NISSAN =====
  if (b === 'nissan') {
    if (['cefiro', 'maxima'].includes(m)) {
      if (y >= 1994 && y <= 2003) return 'FF-L';
      if (y >= 2003 && y <= 2008) return 'FF-M';
    }
    if (['skyline', '350z', '370z', 'infiniti g'].some(x => m.includes(x))) {
      if (y >= 2002) return 'FM';
    }
    if (['x-trail', 'qashqai'].includes(m)) {
      if (y >= 2007 && y <= 2014) return 'J10';
      if (y >= 2014 && y <= 2021) return 'J11';
      if (y >= 2021) return 'J12';
    }
    if (m === 'sunny' || m === 'sentra' || m === 'almera') {
      if (y >= 2000 && y <= 2006) return 'B15';
      if (y >= 2012 && y <= 2019) return 'B17';
    }
    if (['tiida', 'versa', 'note'].includes(m)) {
      if (y >= 2004 && y <= 2012) return 'C11';
      if (y >= 2012) return 'C12';
    }
    if (m === 'patrol') {
      if (y >= 1997 && y <= 2010) return 'Y61';
      if (y >= 2010) return 'Y62';
    }
    if (m === 'navara' || m === 'frontier') {
      if (y >= 1997 && y <= 2014) return 'D22';
      if (y >= 2004 && y <= 2021) return 'D40';
      if (y >= 2014) return 'D23';
    }
    if (m === 'pathfinder') {
      if (y >= 1995 && y <= 2004) return 'R50';
      if (y >= 2004 && y <= 2014) return 'R51';
      if (y >= 2012) return 'R52';
    }
    if (m === 'serena') {
      if (y >= 2000 && y <= 2008) return 'Z50';
      if (y >= 2005 && y <= 2012) return 'C25';
      if (y >= 2010 && y <= 2016) return 'C26';
      if (y >= 2016) return 'C27';
    }
    if (m === 'micra' || m === 'march') {
      if (y >= 2010 && y <= 2019) return 'K13';
    }
  }
  
  // ===== TOYOTA =====
  if (b === 'toyota') {
    if (m === 'camry') {
      if (y >= 1996 && y <= 2006) return 'MC';
      if (y >= 2006 && y <= 2017) return 'XV';
      if (y >= 2017) return 'XV70';
    }
    if (m === 'corolla') {
      if (y >= 2000 && y <= 2008) return 'E120';
      if (y >= 2006 && y <= 2013) return 'E140';
      if (y >= 2013 && y <= 2019) return 'E170';
      if (y >= 2018) return 'E210';
    }
    if (m === 'yaris' || m === 'vitz') {
      if (y >= 1999 && y <= 2005) return 'NCP10';
      if (y >= 2005 && y <= 2010) return 'XP90';
      if (y >= 2010 && y <= 2020) return 'XP130';
    }
    if (m === 'land cruiser prado') {
      if (y >= 2002 && y <= 2009) return 'J120';
      if (y >= 2009 && y <= 2020) return 'J150';
    }
    if (m === 'land cruiser') {
      if (y >= 2007 && y <= 2021) return 'J200';
      if (y >= 2021) return 'J300';
    }
    if (m === 'prius') {
      if (y >= 2000 && y <= 2003) return 'L100';
      if (y >= 2003 && y <= 2009) return 'L200';
      if (y >= 2009 && y <= 2015) return 'L300';
      if (y >= 2015) return 'L500';
    }
    if (['rav4', 'highlander'].includes(m)) {
      if (y >= 2017) return 'GA-K';
    }
    if (m === 'c-hr') {
      if (y >= 2018) return 'GA-C';
    }
    if (m === '86' || m === 'gt86' || m === 'supra') {
      if (y >= 2012 && y <= 2020) return 'S600';
      if (y >= 2019) return 'GC';
    }
    if (m === 'alphard' || m === 'vellfire') {
      if (y >= 1999 && y <= 2005) return 'A30';
      if (y >= 2008 && y <= 2015) return 'A40';
    }
    if (m === 'hiace') {
      if (y >= 1997 && y <= 2004) return 'H120';
      if (y >= 2004 && y <= 2019) return 'H200';
    }
  }
  
  // ===== HONDA =====
  if (b === 'honda') {
    if (m === 'accord') {
      if (y >= 1998 && y <= 2003) return 'JDM-C';
      if (y >= 2003 && y <= 2008) return 'CL';
      if (y >= 2008 && y <= 2013) return 'CU';
      if (y >= 2013 && y <= 2017) return 'CR6';
    }
    if (m === 'cr-v') {
      if (y >= 1997 && y <= 2001) return 'CR';
      if (y >= 2001 && y <= 2006) return 'RD';
      if (y >= 2006 && y <= 2011) return 'RE';
      if (y >= 2012 && y <= 2016) return 'RM';
      if (y >= 2017 && y <= 2022) return 'RW';
      if (y >= 2022) return 'RT';
    }
    if (m === 'civic') {
      if (y >= 1994 && y <= 2001) return 'KA';
      if (y >= 2000 && y <= 2005) return 'EP';
      if (y >= 2005 && y <= 2011) return 'FA';
      if (y >= 2011 && y <= 2015) return 'FB';
      if (y >= 2015 && y <= 2021) return 'FC';
      if (y >= 2021) return 'FL';
    }
    if (m === 'fit' || m === 'jazz') {
      if (y >= 2001 && y <= 2008) return 'GD';
      if (y >= 2007 && y <= 2014) return 'GE';
      if (y >= 2013 && y <= 2020) return 'GK';
      if (y >= 2020) return 'GR';
    }
    if (m === 'odyssey') {
      if (y >= 1997 && y <= 2003) return 'RA6';
      if (y >= 2003 && y <= 2013) return 'RB';
      if (y >= 2013 && y <= 2020) return 'RC';
    }
    if (m === 'vezel' || m === 'hr-v') {
      if (y >= 2014 && y <= 2020) return 'UB';
      if (y >= 2020) return 'RV';
    }
    if (m === 'integra') {
      if (y >= 1997 && y <= 2001) return 'NA';
      if (y >= 2001 && y <= 2006) return 'DC';
      if (y >= 2006 && y <= 2011) return 'DE';
    }
  }
  
  // ===== BMW =====
  if (b === 'bmw') {
    if (m.includes('5 series') || m === 'e39' || m === 'e60' || m === 'f10') {
      if (y >= 1995 && y <= 2003) return 'E39';
      if (y >= 2003 && y <= 2010) return 'E60';
      if (y >= 2010 && y <= 2016) return 'F10';
      if (y >= 2016) return 'G30';
    }
    if (m.includes('3 series') || m === 'e46' || m === 'e90' || m === 'f30') {
      if (y >= 1998 && y <= 2006) return 'E46';
      if (y >= 2005 && y <= 2011) return 'E90';
      if (y >= 2012 && y <= 2018) return 'F30';
      if (y >= 2018) return 'G20';
    }
    if (m === 'x5') {
      if (y >= 1999 && y <= 2006) return 'E53';
      if (y >= 2006 && y <= 2013) return 'E70';
      if (y >= 2013 && y <= 2018) return 'F15';
      if (y >= 2018) return 'G05';
    }
    if (m === 'x3') {
      if (y >= 2003 && y <= 2010) return 'E83';
      if (y >= 2010 && y <= 2017) return 'F25';
      if (y >= 2017) return 'G01';
    }
    if (m === 'x6') {
      if (y >= 2008 && y <= 2014) return 'E71';
      if (y >= 2014 && y <= 2019) return 'F16';
      if (y >= 2019) return 'G06';
    }
    if (m === '7 series' || m === 'e38' || m === 'e65' || m === 'f01') {
      if (y >= 1994 && y <= 2001) return 'E38';
      if (y >= 2001 && y <= 2008) return 'E65';
      if (y >= 2008 && y <= 2015) return 'F01';
      if (y >= 2015 && y <= 2022) return 'G11';
      if (y >= 2022) return 'G70';
    }
    if (m === 'z4') {
      if (y >= 2002 && y <= 2008) return 'E85';
      if (y >= 2009 && y <= 2016) return 'E89';
      if (y >= 2018) return 'G29';
    }
    if (m === 'i3') return 'I01';
    if (m === 'i8') return 'I12';
  }
  
  // ===== MERCEDES-BENZ =====
  if (b === 'mercedes-benz' || b === 'mercedes') {
    if (m.includes('e-class') || m === 'w210' || m === 'w211' || m === 'w213') {
      if (y >= 1995 && y <= 2002) return 'W210';
      if (y >= 2002 && y <= 2009) return 'W211';
      if (y >= 2009 && y <= 2016) return 'W212';
      if (y >= 2016 && y <= 2023) return 'W213';
      if (y >= 2023) return 'W214';
    }
    if (m.includes('c-class') || m === 'w203' || m === 'w204' || m === 'w205') {
      if (y >= 2000 && y <= 2007) return 'W203';
      if (y >= 2007 && y <= 2014) return 'W204';
      if (y >= 2014 && y <= 2021) return 'W205';
      if (y >= 2021) return 'W206';
    }
    if (m.includes('s-class') || m === 'w220' || m === 'w221' || m === 'w222') {
      if (y >= 1998 && y <= 2005) return 'W220';
      if (y >= 2005 && y <= 2013) return 'W221';
      if (y >= 2013 && y <= 2020) return 'W222';
      if (y >= 2020) return 'W223';
    }
    if (m === 'ml-class' || m === 'gle') {
      if (y >= 1997 && y <= 2005) return 'W163';
      if (y >= 2005 && y <= 2011) return 'W164';
      if (y >= 2011 && y <= 2019) return 'W166';
      if (y >= 2019) return 'V167';
    }
    if (m === 'g-class' || m === 'gelandewagen') {
      if (y >= 1990 && y <= 2018) return 'W463';
      if (y >= 2018) return 'W464';
    }
    if (m.includes('sl-class') || m === 'r129' || m === 'r230') {
      if (y >= 1989 && y <= 2001) return 'R129';
      if (y >= 2001 && y <= 2011) return 'R230';
      if (y >= 2012 && y <= 2020) return 'R231';
      if (y >= 2020) return 'R232';
    }
    if (m === 'glc') {
      if (y >= 2015 && y <= 2022) return 'X253';
      if (y >= 2022) return 'X254';
    }
    if (m === 'gls') {
      if (y >= 2019) return 'X167';
    }
    if (m === 'v-class' || m === 'vito' || m === 'viano') {
      if (y >= 2003 && y <= 2014) return 'W639';
      if (y >= 2014) return 'W447';
    }
    if (m === 'cla') {
      if (y >= 2013 && y <= 2019) return 'C117';
      if (y >= 2019) return 'C118';
    }
    if (m === 'gla') {
      if (y >= 2013 && y <= 2020) return 'X156';
      if (y >= 2020) return 'H247';
    }
  }
  
  // ===== VOLKSWAGEN GROUP =====
  if (b === 'volkswagen' || b === 'vw') {
    if (m === 'golf') {
      if (y >= 1997 && y <= 2005) return 'PQ34';
      if (y >= 2003 && y <= 2013) return 'PQ35';
      if (y >= 2008 && y <= 2013) return '5K';
      if (y >= 2012 && y <= 2020) return '5G';
      if (y >= 2019) return 'CD';
    }
    if (m === 'passat') {
      if (y >= 1996 && y <= 2005) return 'PL45';
      if (y >= 2005 && y <= 2015) return 'PQ46';
      if (y >= 2014) return 'MQB B';
    }
    if (m === 'polo') {
      if (y >= 2001 && y <= 2009) return '9N';
      if (y >= 2009 && y <= 2017) return '6R';
      if (y >= 2017) return 'AW';
    }
    if (m === 'tiguan') {
      if (y >= 2007 && y <= 2017) return '5N';
      if (y >= 2017) return 'MQB A2';
    }
    if (m === 'transporter' || m === 'caravelle' || m === 'multivan') {
      if (y >= 2003 && y <= 2015) return 'T5';
      if (y >= 2015) return 'T6';
    }
    if (m === 't-roc' || m === 't-cross') {
      if (y >= 2017) return 'MQB A0';
    }
  }
  
  if (b === 'audi') {
    if (m === 'a3') {
      if (y >= 1996 && y <= 2003) return '8L';
      if (y >= 2003 && y <= 2013) return '8P';
      if (y >= 2012 && y <= 2020) return '8V';
      if (y >= 2020) return '8Y';
    }
    if (m === 'a4') {
      if (y >= 1997 && y <= 2004) return '4B';
      if (y >= 2000 && y <= 2006) return '8E';
      if (y >= 2007 && y <= 2015) return '8K';
      if (y >= 2015) return '8W';
    }
    if (m === 'a6') {
      if (y >= 1997 && y <= 2004) return '4B';
      if (y >= 2004 && y <= 2011) return '4F';
      if (y >= 2010 && y <= 2018) return '4G';
      if (y >= 2018) return '4K';
    }
    if (m === 'a8') {
      if (y >= 2010 && y <= 2018) return '4H';
      if (y >= 2017) return '4N';
    }
    if (m === 'q5') {
      if (y >= 2008 && y <= 2017) return '8R';
      if (y >= 2017) return 'FY';
    }
    if (m === 'q7') {
      if (y >= 2005 && y <= 2015) return '4L';
      if (y >= 2015) return '4M';
    }
    if (m === 'q3') {
      if (y >= 2011 && y <= 2018) return '8X';
      if (y >= 2018) return 'F3';
    }
    if (m === 'tt') {
      if (y >= 1998 && y <= 2006) return '42';
      if (y >= 2006 && y <= 2014) return '8J';
      if (y >= 2014 && y <= 2023) return 'FV';
      if (y >= 2023) return 'FV3';
    }
    if (m === 'r8') {
      if (y >= 2007 && y <= 2019) return '8C';
      if (y >= 2015) return '4S';
    }
    if (m === 'a5') {
      if (y >= 2007 && y <= 2016) return '8T';
      if (y >= 2016) return 'F5';
    }
    if (m === 'a1') {
      if (y >= 2010 && y <= 2018) return '8X';
      if (y >= 2018) return 'GB';
    }
    if (m === 'e-tron') {
      if (y >= 2018) return 'MLB Evo';
    }
  }
  
  if (b === 'skoda') {
    if (m === 'octavia') {
      if (y >= 1996 && y <= 2010) return 'PQ34';
      if (y >= 2004 && y <= 2013) return 'PQ35';
      if (y >= 2013 && y <= 2020) return 'MQB';
      if (y >= 2020) return 'MQB Evo';
    }
    if (m === 'fabia') {
      if (y >= 1999 && y <= 2007) return 'PQ24';
      if (y >= 2007 && y <= 2014) return 'PQ25';
      if (y >= 2014) return 'MQB A0';
    }
    if (m === 'superb') {
      if (y >= 2001 && y <= 2008) return 'PL45';
      if (y >= 2008 && y <= 2015) return 'PQ46';
      if (y >= 2015) return 'MQB B';
    }
    if (m === 'kodiaq' || m === 'karoq') {
      if (y >= 2016) return 'MQB A2';
    }
  }
  
  if (b === 'seat') {
    if (m === 'leon') {
      if (y >= 1999 && y <= 2005) return 'PQ34';
      if (y >= 2005 && y <= 2012) return 'PQ35';
      if (y >= 2012 && y <= 2020) return 'MQB';
      if (y >= 2020) return 'MQB Evo';
    }
    if (m === 'ibiza') {
      if (y >= 2002 && y <= 2008) return 'PQ24';
      if (y >= 2008 && y <= 2017) return 'PQ25';
      if (y >= 2017) return 'MQB A0';
    }
    if (m === 'ateca' || m === 'arona') {
      if (y >= 2016) return 'MQB A0';
    }
  }
  
  // ===== MAZDA =====
  if (b === 'mazda') {
    if (m === 'mazda6' || m === 'atenza') {
      if (y >= 2002 && y <= 2008) return 'GG';
      if (y >= 2007 && y <= 2012) return 'GH';
      if (y >= 2012 && y <= 2020) return 'GJ';
      if (y >= 2020) return 'GJ2';
    }
    if (m === 'mazda3' || m === 'axela') {
      if (y >= 2003 && y <= 2009) return 'BK';
      if (y >= 2009 && y <= 2013) return 'BL';
      if (y >= 2013 && y <= 2019) return 'BN';
      if (y >= 2019) return 'BP';
    }
    if (m === 'cx-5') {
      if (y >= 2011 && y <= 2017) return 'KE';
      if (y >= 2017) return 'KF';
    }
    if (m === 'cx-3') {
      if (y >= 2014 && y <= 2020) return 'DJ';
    }
    if (m === 'cx-30') {
      if (y >= 2019) return 'DK';
    }
    if (m === 'cx-9') {
      if (y >= 2006 && y <= 2015) return 'TB';
      if (y >= 2015) return 'KG';
    }
    if (m === 'cx-7') {
      if (y >= 2006 && y <= 2012) return 'ER';
    }
    if (m === 'mazda5' || m === 'premacy') {
      if (y >= 2006 && y <= 2012) return 'CW';
      if (y >= 2012 && y <= 2017) return 'CR';
    }
  }
  
  // ===== MITSUBISHI =====
  if (b === 'mitsubishi') {
    if (m === 'lancer') {
      if (y >= 2000 && y <= 2007) return 'ZJ';
      if (y >= 2007 && y <= 2012) return 'CY';
    }
    if (m === 'outlander') {
      if (y >= 2005 && y <= 2012) return 'CU';
      if (y >= 2012 && y <= 2020) return 'GG';
      if (y >= 2020) return 'ZK';
    }
    if (m === 'pajero') {
      if (y >= 1999 && y <= 2006) return 'V70';
      if (y >= 2006 && y <= 2015) return 'V80';
      if (y >= 2015 && y <= 2021) return 'V90';
    }
    if (m === 'delica') {
      if (y >= 2005 && y <= 2020) return 'D5';
    }
    if (m === 'colt' || m === 'mirage') {
      if (y >= 2005 && y <= 2012) return 'CX';
      if (y >= 2012 && y <= 2020) return 'A0';
    }
    if (m === 'galant') {
      if (y >= 1995 && y <= 2003) return 'GA';
      if (y >= 2003 && y <= 2012) return 'DJ';
    }
    if (m === 'grandis') {
      if (y >= 2006 && y <= 2013) return 'KH';
    }
  }
  
  // ===== SUBARU =====
  if (b === 'subaru') {
    if (m === 'legacy' || m === 'outback') {
      if (y >= 1998 && y <= 2003) return 'BE';
      if (y >= 2003 && y <= 2009) return 'BL';
      if (y >= 2009 && y <= 2014) return 'BM';
      if (y >= 2014 && y <= 2019) return 'BN';
      if (y >= 2019) return 'BW';
    }
    if (m === 'impreza' || m === 'wrx') {
      if (y >= 2000 && y <= 2007) return 'GD';
      if (y >= 2007 && y <= 2011) return 'GE';
      if (y >= 2011 && y <= 2016) return 'GP';
      if (y >= 2016) return 'GT';
    }
    if (m === 'forester') {
      if (y >= 2008 && y <= 2015) return 'SH';
      if (y >= 2012 && y <= 2018) return 'SJ';
      if (y >= 2018) return 'SK';
    }
    if (m === 'brz' || m === 'toyota 86') {
      if (y >= 2012 && y <= 2020) return 'ZC';
      if (y >= 2020) return 'ZD';
    }
    if (m === 'exiga') {
      if (y >= 2008 && y <= 2014) return 'BR';
    }
  }
  
  // ===== HYUNDAI / KIA =====
  if (b === 'hyundai') {
    if (m === 'sonata') {
      if (y >= 1998 && y <= 2005) return 'EF';
      if (y >= 2004 && y <= 2010) return 'NF';
      if (y >= 2009 && y <= 2014) return 'YF';
      if (y >= 2014 && y <= 2019) return 'LF';
      if (y >= 2019) return 'DN8';
    }
    if (m === 'santa fe') {
      if (y >= 2005 && y <= 2010) return 'HD';
      if (y >= 2012 && y <= 2018) return 'DM';
      if (y >= 2018 && y <= 2023) return 'TM';
      if (y >= 2023) return 'MX5';
    }
    if (m === 'tucson') {
      if (y >= 2006 && y <= 2012) return 'JM';
      if (y >= 2009 && y <= 2015) return 'LM';
      if (y >= 2015 && y <= 2020) return 'TL';
      if (y >= 2020) return 'NX4';
    }
    if (m === 'creta' || m === 'ix25') {
      if (y >= 2014) return 'LM';
    }
    if (m === 'palisade') {
      if (y >= 2018) return 'LX2';
    }
  }
  
  if (b === 'kia') {
    if (m === 'sportage') {
      if (y >= 2000 && y <= 2006) return 'J3';
      if (y >= 2010 && y <= 2015) return 'SL';
      if (y >= 2015 && y <= 2021) return 'QL';
      if (y >= 2021) return 'NQ5';
    }
    if (m === 'sorento') {
      if (y >= 2006 && y <= 2013) return 'TD';
      if (y >= 2009 && y <= 2015) return 'XM';
      if (y >= 2014 && y <= 2020) return 'UM';
      if (y >= 2020) return 'MQ4';
    }
    if (m === 'optima' || m === 'magentis' || m === 'k5') {
      if (y >= 2000 && y <= 2006) return 'EF';
      if (y >= 2004 && y <= 2010) return 'NF';
      if (y >= 2010 && y <= 2015) return 'TF';
      if (y >= 2015 && y <= 2020) return 'JF';
      if (y >= 2020) return 'DL3';
    }
    if (m === 'carnival' || m === 'sedona') {
      if (y >= 1998 && y <= 2005) return 'DE';
      if (y >= 2005 && y <= 2014) return 'GQ';
      if (y >= 2014 && y <= 2020) return 'YP';
      if (y >= 2020) return 'KA4';
    }
    if (m === 'ceed' || m === 'cerato' || m === 'forte') {
      if (y >= 2006 && y <= 2012) return 'ED';
      if (y >= 2012 && y <= 2018) return 'YD';
      if (y >= 2018) return 'BD';
    }
    if (m === 'rio' || m === 'accent') {
      if (y >= 2005 && y <= 2011) return 'JB';
      if (y >= 2011 && y <= 2017) return 'UB';
      if (y >= 2017) return 'YB';
    }
    if (m === 'stinger') {
      if (y >= 2017) return 'CK';
    }
    if (m === 'telluride') {
      if (y >= 2019) return 'ON';
    }
  }
  
  // ===== RENAULT / DACIA =====
  if (b === 'renault') {
    if (m === 'megane' || m === 'scenic') {
      if (y >= 2001 && y <= 2015) return 'B84';
    }
    if (m === 'clio') {
      if (y >= 2005 && y <= 2019) return 'B95';
      if (y >= 2019) return 'B0';
    }
    if (m === 'laguna') {
      if (y >= 2001 && y <= 2008) return 'B81';
      if (y >= 2007 && y <= 2015) return 'B87';
    }
    if (m === 'koleos') {
      if (y >= 2003 && y <= 2015) return 'X81';
      if (y >= 2015) return 'H47';
    }
    if (m === 'kadjar') {
      if (y >= 2015) return 'H47';
    }
    if (m === 'captur') {
      if (y >= 2013 && y <= 2019) return 'HS';
      if (y >= 2019) return 'JB';
    }
    if (m === 'espace') {
      if (y >= 2007 && y <= 2016) return 'L38';
      if (y >= 2014) return 'RFE';
    }
  }
  
  if (b === 'dacia') {
    if (m === 'logan' || m === 'sandero') {
      if (y >= 2004 && y <= 2012) return 'B0';
      if (y >= 2012 && y <= 2020) return 'B35';
      if (y >= 2020) return 'B52';
    }
    if (m === 'duster') {
      if (y >= 2010 && y <= 2017) return 'B0';
      if (y >= 2017) return 'B35';
    }
  }
  
  // ===== PEUGEOT / CITROËN =====
  if (b === 'peugeot') {
    if (m === '307' || m === '308' || m === 'c4') {
      if (y >= 2001 && y <= 2015) return 'PF2';
    }
    if (m === '407' || m === '508' || m === 'c5') {
      if (y >= 2005 && y <= 2015) return 'PF3';
    }
    if (m === '206' || m === '207' || m === 'c3') {
      if (y >= 1998 && y <= 2008) return 'PF1';
    }
    if (m === '308' || m === '508') {
      if (y >= 2013) return 'EMP2';
    }
    if (m === '208' || m === '2008') {
      if (y >= 2016) return 'CMP';
    }
    if (m === 'partner' || m === 'berlingo') {
      if (y >= 2006 && y <= 2014) return 'T7';
      if (y >= 2018) return 'K9';
    }
  }
  
  if (b === 'citroen' || b === 'citroën') {
    if (m === 'c5') {
      if (y >= 1999 && y <= 2007) return 'LCR';
      if (y >= 2007 && y <= 2017) return 'X7';
    }
    if (m === 'c3') {
      if (y >= 2001 && y <= 2009) return 'R83';
      if (y >= 2009 && y <= 2016) return 'SC';
      if (y >= 2016) return 'SX';
    }
    if (m === 'c4 picasso' || m === 'grand c4 picasso') {
      if (y >= 2013 && y <= 2020) return 'E8';
    }
    if (m === 'c4 cactus') {
      if (y >= 2013 && y <= 2020) return 'U6';
    }
    if (m === 'c5 aircross') {
      if (y >= 2018) return 'M4';
    }
  }
  
  // ===== FORD =====
  if (b === 'ford') {
    if (m === 'focus') {
      if (y >= 2003 && y <= 2011) return 'C1';
      if (y >= 2011 && y <= 2018) return 'C394';
      if (y >= 2018) return 'C2';
    }
    if (m === 'mondeo') {
      if (y >= 2000 && y <= 2007) return 'P2';
      if (y >= 2007 && y <= 2014) return 'CW539';
      if (y >= 2013 && y <= 2020) return 'CD4';
    }
    if (m === 'fiesta') {
      if (y >= 2002 && y <= 2008) return 'P531';
      if (y >= 2008 && y <= 2017) return 'JA8';
      if (y >= 2017 && y <= 2023) return 'CB3';
    }
    if (m === 'escape' || m === 'kuga') {
      if (y >= 2001 && y <= 2007) return 'U251';
      if (y >= 2007 && y <= 2012) return 'U365';
      if (y >= 2012 && y <= 2019) return 'C520';
      if (y >= 2019) return 'CX482';
    }
    if (m === 'explorer') {
      if (y >= 2011 && y <= 2019) return 'U502';
      if (y >= 2019) return 'U625';
    }
    if (m === 'fusion') {
      if (y >= 2006 && y <= 2012) return 'CD3';
      if (y >= 2013 && y <= 2020) return 'CD4';
    }
    if (m === 's-max' || m === 'galaxy') {
      if (y >= 2006 && y <= 2015) return 'EUCD';
    }
    if (m === 'transit') {
      if (y >= 2012) return 'V362';
    }
  }
  
  // ===== CHEVROLET / GM =====
  if (b === 'chevrolet') {
    if (m === 'lacetti' || m === 'cruze') {
      if (y >= 2002 && y <= 2010) return 'Epsilon';
      if (y >= 2016) return 'D2XX';
    }
    if (m === 'malibu') {
      if (y >= 2008 && y <= 2017) return 'Epsilon II';
      if (y >= 2016) return 'E2XX';
    }
    if (m === 'aveo' || m === 'sonic') {
      if (y >= 2005 && y <= 2015) return 'Gamma';
      if (y >= 2011 && y <= 2020) return 'Gamma II';
    }
    if (m === 'captiva') {
      if (y >= 2005 && y <= 2015) return 'Theta';
    }
    if (m === 'equinox') {
      if (y >= 2005 && y <= 2017) return 'Theta';
      if (y >= 2009 && y <= 2018) return 'Theta II';
      if (y >= 2019) return 'VSS-F';
    }
    if (m === 'blazer') {
      if (y >= 2019) return 'VSS-F';
    }
    if (m === 'tahoe' || m === 'suburban') {
      if (y >= 2006 && y <= 2014) return 'GMT900';
      if (y >= 2013 && y <= 2019) return 'K2XX';
      if (y >= 2020) return 'Y2XX';
    }
    if (m === 'silverado' || m === 'sierra') {
      if (y >= 2006 && y <= 2014) return 'GMT900';
      if (y >= 2013 && y <= 2019) return 'K2XX';
      if (y >= 2018) return 'T1XX';
    }
    if (m === 'traverse' || m === 'acadia') {
      if (y >= 2013 && y <= 2019) return 'P2XX';
      if (y >= 2017) return 'C1XX';
    }
    if (m === 'bolt') {
      if (y >= 2016) return 'BEV3';
      if (y >= 2021) return 'Ultium';
    }
  }
  
  if (b === 'opel' || b === 'vauxhall') {
    if (m === 'astra') {
      if (y >= 2005 && y <= 2015) return 'Delta';
      if (y >= 2009 && y <= 2017) return 'Delta II';
      if (y >= 2015) return 'P2';
    }
    if (m === 'insignia') {
      if (y >= 2008 && y <= 2017) return 'Epsilon II';
      if (y >= 2017) return 'E2XX';
    }
    if (m === 'corsa') {
      if (y >= 2006 && y <= 2014) return 'SCCS';
      if (y >= 2014) return 'P2';
    }
  }
  
  // ===== LEXUS =====
  if (b === 'lexus') {
    if (m.startsWith('es')) {
      if (y >= 1996 && y <= 2001) return 'XV20';
      if (y >= 2001 && y <= 2006) return 'XV30';
      if (y >= 2006 && y <= 2012) return 'XV40';
      if (y >= 2018) return 'XV70';
    }
    if (m.startsWith('is')) {
      if (y >= 2005 && y <= 2013) return 'XF40';
      if (y >= 2013 && y <= 2020) return 'XF50';
      if (y >= 2020) return 'XE40';
    }
    if (m.startsWith('gs')) {
      if (y >= 2005 && y <= 2015) return 'UX10';
      if (y >= 2012 && y <= 2020) return 'GL10';
    }
    if (m.startsWith('ls')) {
      if (y >= 1998 && y <= 2005) return 'ZL10';
      if (y >= 2006 && y <= 2017) return 'XF40';
      if (y >= 2017) return 'XF50';
    }
    if (m.startsWith('rx')) {
      if (y >= 2002 && y <= 2009) return 'AL10';
      if (y >= 2008 && y <= 2015) return 'AL20';
      if (y >= 2015 && y <= 2022) return 'AL30';
      if (y >= 2022) return 'AL40';
    }
    if (m.startsWith('nx')) {
      if (y >= 2014) return 'GA-K';
    }
    if (m.startsWith('ux')) {
      if (y >= 2018) return 'GA-C';
    }
  }
  
  // ===== INFINITI =====
  if (b === 'infiniti') {
    if (m.startsWith('g') || m.startsWith('q50')) {
      if (y >= 2001 && y <= 2006) return 'V35';
      if (y >= 2006 && y <= 2013) return 'V36';
      if (y >= 2013) return 'V37';
    }
    if (m.startsWith('fx') || m.startsWith('qx70')) {
      if (y >= 2002 && y <= 2009) return 'S30';
      if (y >= 2008 && y <= 2017) return 'S51';
    }
    if (m.startsWith('m') || m.startsWith('q70')) {
      if (y >= 2007 && y <= 2013) return 'J50';
      if (y >= 2010 && y <= 2019) return 'Y51';
    }
    if (m.startsWith('qx80') || m === 'qx56') {
      if (y >= 2003 && y <= 2010) return 'Z50';
      if (y >= 2010 && y <= 2019) return 'Z62';
      if (y >= 2019) return 'Z63';
    }
    if (m.startsWith('ex') || m.startsWith('qx50')) {
      if (y >= 2007 && y <= 2013) return 'K13';
      if (y >= 2013 && y <= 2019) return 'J50';
      if (y >= 2019) return 'J51';
    }
  }
  
  // ===== SUZUKI =====
  if (b === 'suzuki') {
    if (m === 'swift' || m === 'ignis') {
      if (y >= 2001 && y <= 2008) return 'AH';
      if (y >= 2003 && y <= 2010) return 'ZC';
      if (y >= 2010 && y <= 2017) return 'NZ';
      if (y >= 2017) return 'AZ';
    }
    if (m === 'sx4') {
      if (y >= 2004 && y <= 2010) return 'AZ';
    }
    if (m === 'vitara' || m === 'grand vitara') {
      if (y >= 2005 && y <= 2014) return 'YA';
      if (y >= 2014) return 'LY';
    }
    if (m === 'jimny') {
      if (y >= 2006 && y <= 2015) return 'MA';
      if (y >= 2018) return 'JB';
    }
    if (m === 'baleno') {
      if (y >= 2015) return 'YC';
    }
  }
  
  // ===== LAND ROVER / RANGE ROVER =====
  if (b === 'land rover' || b === 'range rover') {
    if (m.includes('range rover')) {
      if (y >= 1989 && y <= 1998) return 'L338';
      if (y >= 2002 && y <= 2012) return 'L322';
      if (y >= 2012 && y <= 2021) return 'L405';
      if (y >= 2021) return 'L460';
    }
    if (m.includes('range rover sport')) {
      if (y >= 2005 && y <= 2013) return 'L320';
      if (y >= 2013 && y <= 2022) return 'L494';
      if (y >= 2022) return 'L461';
    }
    if (m === 'discovery') {
      if (y >= 2017) return 'L550';
    }
    if (m === 'discovery sport') {
      if (y >= 2014) return 'L551';
    }
    if (m === 'freelander') {
      if (y >= 1997 && y <= 2005) return 'L316';
      if (y >= 2006 && y <= 2014) return 'L359';
    }
    if (m === 'defender') {
      if (y >= 2018) return 'L663';
    }
    if (m === 'velar') {
      if (y >= 2017) return 'L538';
    }
  }
  
  // ===== JEEP =====
  if (b === 'jeep') {
    if (m === 'grand cherokee') {
      if (y >= 2004 && y <= 2010) return 'WK';
      if (y >= 2010 && y <= 2021) return 'WK2';
      if (y >= 2021) return 'WL';
    }
    if (m === 'wrangler') {
      if (y >= 2006 && y <= 2018) return 'JK';
      if (y >= 2018) return 'JL';
    }
    if (m === 'gladiator') {
      if (y >= 2019) return 'JT';
    }
    if (m === 'cherokee') {
      if (y >= 2013 && y <= 2020) return 'KL';
    }
    if (m === 'compass' || m === 'patriot') {
      if (y >= 2007 && y <= 2017) return 'BU';
      if (y >= 2017) return 'MP';
    }
    if (m === 'renegade') {
      if (y >= 2014) return 'B1';
    }
  }
  
  // ===== VOLVO =====
  if (b === 'volvo') {
    if (['s40', 'v50', 'c30', 'c70'].includes(m)) {
      if (y >= 1995 && y <= 2004) return '400';
      if (y >= 2003 && y <= 2012) return 'P1';
    }
    if (['s60', 'v60', 'v70', 'xc70'].includes(m)) {
      if (y >= 1999 && y <= 2006) return 'P2';
      if (y >= 2006 && y <= 2016) return 'P3';
    }
    if (m === 's80') {
      if (y >= 1998 && y <= 2006) return 'P2';
      if (y >= 2006 && y <= 2016) return 'P3';
    }
    if (m === 'xc90') {
      if (y >= 2002 && y <= 2014) return 'P2';
      if (y >= 2014) return 'SPA';
    }
    if (m === 'xc60') {
      if (y >= 2008 && y <= 2017) return 'P3';
      if (y >= 2017) return 'SPA';
    }
    if (m === 's90' || m === 'v90') {
      if (y >= 2016) return 'SPA';
    }
    if (m === 'xc40' || m === 'c40') {
      if (y >= 2017) return 'CMA';
    }
    if (m === 's60' && y >= 2018) return 'SPA';
  }
  
  // ===== TESLA =====
  if (b === 'tesla') {
    if (m === 'model s' || m === 'model x') return 'Tesla S';
    if (m === 'model 3' || m === 'model y') return 'Tesla 3';
    if (m === 'roadster') {
      if (y >= 2008 && y <= 2012) return 'Tesla R';
      if (y >= 2023) return 'Tesla R2';
    }
    if (m === 'semi') return 'Tesla Semi';
    if (m === 'cybertruck') return 'Tesla CT';
  }
  
  // ===== PORSCHE =====
  if (b === 'porsche') {
    if (m === '911') {
      if (y >= 1997 && y <= 2005) return '996';
      if (y >= 2004 && y <= 2012) return '997';
      if (y >= 2011 && y <= 2019) return '991';
      if (y >= 2019) return '992';
    }
    if (m === 'boxster' || m === '718 boxster') {
      if (y >= 1996 && y <= 2004) return '986';
      if (y >= 2004 && y <= 2012) return '987';
      if (y >= 2012 && y <= 2016) return '981';
      if (y >= 2016) return '982';
    }
    if (m === 'cayman' || m === '718 cayman') {
      if (y >= 2005 && y <= 2012) return '987';
      if (y >= 2012 && y <= 2016) return '981';
      if (y >= 2016) return '982';
    }
    if (m === 'cayenne') {
      if (y >= 2002 && y <= 2010) return '9PA';
      if (y >= 2010 && y <= 2017) return '92A';
      if (y >= 2017) return 'E3';
    }
    if (m === 'macan') {
      if (y >= 2014) return 'MLB';
    }
    if (m === 'panamera') {
      if (y >= 2009 && y <= 2016) return 'G1';
      if (y >= 2016) return 'G2';
    }
    if (m === 'taycan') {
      if (y >= 2019) return 'J1';
    }
  }
}