const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());

// ============================================================
// 1. CONFIGURAÇÕES PADRÃO (ESCOPO GLOBAL)
// ============================================================
const UPSTREAM_BASE = "https://94c8cb9f702d-brazuca-torrents.baby-beamup.club";
const DEFAULT_NAME = "BR"; 
const DEFAULT_LOGO = "https://i.imgur.com/KVpfrAk.png";
const PROJECT_VERSION = "1.0.0"; 
const STREMTHRU_HOST = "https://stremthrufortheweebs.midnightignite.me"; 

const REFERRAL_TB = "b08bcd10-8df2-44c9-a0ba-4d5bdb62ef96";

// Links de Addons Extras
const TORRENTIO_PT_URL = "https://torrentio.strem.fun/providers=nyaasi,tokyotosho,anidex,comando,bludv,micoleaodublado|language=portuguese/manifest.json";

// ============================================================
// 2. CONTEÚDO AIOSTREAMS (CONFIGURAÇÃO COMPLETA)
// ============================================================
// Este JSON agora inclui os presets E o formatter visual juntos
const AIO_CONFIG_JSON = {
  "services": [
    {
      "id": "torbox",
      "enabled": true,
      "credentials": {}
    },
    {
      "id": "realdebrid",
      "enabled": false,
      "credentials": {}
    },
    {
      "id": "alldebrid",
      "enabled": false,
      "credentials": {}
    },
    {
      "id": "premiumize",
      "enabled": false,
      "credentials": {}
    },
    {
      "id": "debridlink",
      "enabled": false,
      "credentials": {}
    },
    {
      "id": "stremio_nntp",
      "enabled": false,
      "credentials": {}
    },
    {
      "id": "nzbdav",
      "enabled": false,
      "credentials": {}
    },
    {
      "id": "altmount",
      "enabled": false,
      "credentials": {}
    },
    {
      "id": "offcloud",
      "enabled": false,
      "credentials": {}
    },
    {
      "id": "putio",
      "enabled": false,
      "credentials": {}
    },
    {
      "id": "easynews",
      "enabled": false,
      "credentials": {}
    },
    {
      "id": "easydebrid",
      "enabled": false,
      "credentials": {}
    },
    {
      "id": "debrider",
      "enabled": false,
      "credentials": {}
    },
    {
      "id": "pikpak",
      "enabled": false,
      "credentials": {}
    },
    {
      "id": "seedr",
      "enabled": false,
      "credentials": {}
    }
  ],
  "presets": [
    {
      "type": "stremthruTorz",
      "instanceId": "52c",
      "enabled": true,
      "options": {
        "name": "StremThru Torz",
        "timeout": 15000,
        "resources": [
          "stream"
        ],
        "mediaTypes": [],
        "services": [
          "torbox"
        ],
        "includeP2P": false,
        "useMultipleInstances": false
      }
    },
    {
      "type": "torbox-search",
      "instanceId": "f7a",
      "enabled": true,
      "options": {
        "name": "TorBox Search",
        "timeout": 15000,
        "sources": [
          "torrent"
        ],
        "services": [
          "torbox"
        ],
        "mediaTypes": [],
        "userSearchEngines": false,
        "onlyShowUserSearchResults": false,
        "useMultipleInstances": false
      }
    },
    {
      "type": "bitmagnet",
      "instanceId": "437",
      "enabled": true,
      "options": {
        "name": "Bitmagnet",
        "timeout": 15000,
        "mediaTypes": [],
        "services": [
          "torbox"
        ],
        "useMultipleInstances": false,
        "paginate": false
      }
    },
    {
      "type": "tmdb-addon",
      "instanceId": "6d5",
      "enabled": true,
      "options": {
        "name": "The Movie Database",
        "timeout": 15000,
        "resources": [
          "catalog",
          "meta"
        ],
        "url": "https://tmdb.elfhosted.com/N4IgTgDgJgRg1gUwJ4gFwgC4AYC0AzMBBHSWEAGhAjAHsA3ASygQEkBbWFqNTMAVwQVwCDHzAA7dp27oM-QZQA2AQ3EBzPsrWD0EDDgBCAJSEBnOQmVsG6tAG0Q4vAA8hACxhshUcRCFW-SgBjfiEINkCQZQxItRo-AF1g6OVFGjVTe1AmHgwOGAA6DHihDCQIHRA2egYFRytKgAV4vhUwMzcaAHcWcQAJGjYdOQEAX3JsmUx8opLKMoqeUwQwWszKcQaeZohW5XbKU06e-sHh+XHJ3JmLcSgbNVLyyurGOs2hngAVQjuHju6vQGn1QIwQlxAOVkN1+91s82eSxWayEH0qPwQf3hICOgNOILBEKhOIsVgeBScrgRi3Qr1qqK26AAciI8IoGFScccgWc0ISJpCpuZCGT1BSXE8aTjkQh1vUQSAWRg2RyASdgecxgLicLLNYxR4vNSXjV3oyQH0DAB5AAEAFllJzcereaCLtqhaT9WoCobJZVlqtZQyFZbbQ6ndz8ZrwR6ll7yT5IgsTW8Q5UACIMUziZAAajVPIJ7qu6F1op9Sf9SKDcrRPCzOfzhejfJLgvjIu9BQC1dppvT21WQxtADUmAgaC2NW2taWSV3yb3jTWURtzY1hwgxxOp4cozO3XOO2WE2LwsnEf20+uFY19lYaHxxBgC-u8Yf+fPy92L33pbWg7oPeYCPs+r7Tq6X4nguepLjE-50maCoAIIQBAijbl8o5vlyH5Qe2Opnj60SXlKgZrvKlRoRhWE4ZBxbHkRi5inEZGpvSt6VAA4mkMDxCoKDvi6jGxt+xEFCEfCIQOXE8AAwvw4hBG4SC0IoigMTGRKeixPpsf+FHBnJ6C8TQ-EYcoQl4SJ2lxqeemSaEK5ljKdbmopz4qWpNAaVps7gkkUTaEY0T-OgJjJOY8lPi+aAAKzCShIVheovTcZihCZLI8hCJiygwJhyUIKFGDhSAeCpMsarFaVDwAOoMBgbhSDAdW2OglWKNVoxAA/manifest.json",
        "Enable Adult Content": false,
        "hideEpisodeThumbnails": false,
        "provideImdbId": true,
        "ageRating": "R",
        "language": "pt-BR"
      }
    },
    {
      "type": "anime-kitsu",
      "instanceId": "3ac",
      "enabled": true,
      "options": {
        "name": "Anime Kitsu",
        "timeout": 15000,
        "resources": [
          "catalog",
          "meta"
        ]
      }
    }
  ],
  "formatter": {
    "id": "custom",
    "definition": {
      "name": "{stream.resolution::=2160p[\"🎞️ 4K\"||\"\"]}{stream.resolution::=1440p[\"🎞️ 2K\"||\"\"]}{stream.resolution::=1080p[\"🎞️ FHD\"||\"\"]}{stream.resolution::=720p[\"💿 HD\"||\"\"]}{stream.resolution::=576p[\"📼 576P\"||\"\"]}{stream.resolution::=480p[\"📼 480P\"||\"\"]}{stream.resolution::exists[\"\"||\"❔ Unkown Resolution\"]}\n{stream.quality::~REMUX[\"📀 Remux\"||\"\"]}{stream.quality::=BluRay[\"💿 BluRay\"||\"\"]}{stream.quality::~DL[\"🌐 WEBDL\"||\"\"]}{stream.quality::=WEBRIP[\"🖥 WEBRip\"||\"\"]}{stream.quality::=HDRIP[\"💾 HDRip\"||\"\"]}{stream.quality::~HC[\"💾 HC\"||\"\"]}{stream.quality::=DVDRip[\"💾 DVDRip\"||\"\"]}{stream.quality::=HDTV[\"💾 HDTV\"||\"\"]}{stream.quality::=TS[\"💾 TS\"||\"\"]}{stream.quality::=TC[\"💾 TC\"||\"\"]}",
      "description": "{stream.network::exists[\" 🍿 {stream.network}\"||\"\"]}\n🧩{addon.name} 🫆 {service.shortName}{service.cached::istrue[\"⚡\"||\"\"]}{service.cached::isfalse[\"⏳\"||\"\"]} {stream.proxied::istrue[\"👻\"||\"\"]}{stream.seeders::>0[\"🌱{stream.seeders}  \"||\"\"]}\n{stream.visualTags::exists[\"📺{stream.visualTags::join(' · ')} \"||\"\"]}{stream.audioTags::exists[\"🔊 {stream.audioTags::join(' 🎧 ')}\"||\"\"]} \n{stream.size::>0[\"📁 {stream.size::bytes} \"||\"\"]}{stream.folderSize::>0[\"📦 {stream.folderSize::bytes}\"||\"\"]}{stream.duration::>0[\"⏱️ {stream.duration::time} \"||\"\"]}\n{stream.languages::exists[\"🗣 {stream.uLanguageEmojis::join(' / ')}\"||\"\"]}{stream.title::~brazilian::or::stream.filename::~brazilian::or::stream.title::~dublado::or::stream.filename::~dublado::or::stream.title::~'pt-br'::or::stream.filename::~'pt-br'::or::stream.title::~'multi-audio'::or::stream.filename::~'multi-audio'::or::stream.releaseGroup::=100real::or::stream.releaseGroup::=3lton::or::stream.releaseGroup::=aconduta::or::stream.releaseGroup::=adamantium::or::stream.releaseGroup::=alfahd::or::stream.releaseGroup::=amantedoharpia::or::stream.releaseGroup::=anonimo::or::stream.releaseGroup::=anonymous07::or::stream.releaseGroup::=asm::or::stream.releaseGroup::=asy::or::stream.releaseGroup::=azx::or::stream.releaseGroup::=bad::or::stream.releaseGroup::=bdc::or::stream.releaseGroup::=big::or::stream.releaseGroup::=bioma::or::stream.releaseGroup::=bnd::or::stream.releaseGroup::=brhd::or::stream.releaseGroup::=byoutou::or::stream.releaseGroup::=c.a.a::or::stream.releaseGroup::=c0ral::or::stream.releaseGroup::=c76::or::stream.releaseGroup::=cbr::or::stream.releaseGroup::=cory::or::stream.releaseGroup::=cza::or::stream.releaseGroup::=dalmaciojr::or::stream.releaseGroup::=dks::or::stream.releaseGroup::=dm::or::stream.releaseGroup::=elm4g0::or::stream.releaseGroup::=emmid::or::stream.releaseGroup::=eri::or::stream.releaseGroup::=estagiario::or::stream.releaseGroup::=extr3muss::or::stream.releaseGroup::=fantasma223::or::stream.releaseGroup::=ff::or::stream.releaseGroup::=fido::or::stream.releaseGroup::=filehd::or::stream.releaseGroup::=fly::or::stream.releaseGroup::=foxx::or::stream.releaseGroup::=franzopl::or::stream.releaseGroup::=freddiegellar::or::stream.releaseGroup::=freedomhd::or::stream.releaseGroup::=g4ris::or::stream.releaseGroup::=gmn::or::stream.releaseGroup::=got::or::stream.releaseGroup::=gris::or::stream.releaseGroup::=gueira::or::stream.releaseGroup::=izards::or::stream.releaseGroup::=jk::or::stream.releaseGroup::=joekerr::or::stream.releaseGroup::=jus::or::stream.releaseGroup::=kallango::or::stream.releaseGroup::=lapumia::or::stream.releaseGroup::=lcd::or::stream.releaseGroup::=lmb::or::stream.releaseGroup::=ltda::or::stream.releaseGroup::=lucano22::or::stream.releaseGroup::=lukas::or::stream.releaseGroup::=madruga::or::stream.releaseGroup::=master::or::stream.releaseGroup::=mdg::or::stream.releaseGroup::=mlh::or::stream.releaseGroup::=n3g4n::or::stream.releaseGroup::=nex::or::stream.releaseGroup::=nous3r::or::stream.releaseGroup::=ntz::or::stream.releaseGroup::=olympus::or::stream.releaseGroup::=oscarniemeyer::or::stream.releaseGroup::=pd::or::stream.releaseGroup::=pia::or::stream.releaseGroup::=piratadigital::or::stream.releaseGroup::=plushd::or::stream.releaseGroup::=potatin::or::stream.releaseGroup::=princeputt20::or::stream.releaseGroup::=professor_x::or::stream.releaseGroup::=rarbr::or::stream.releaseGroup::=riper::or::stream.releaseGroup::=rk::or::stream.releaseGroup::=rlee::or::stream.releaseGroup::=rq::or::stream.releaseGroup::=sacerdoti::or::stream.releaseGroup::=sgf::or::stream.releaseGroup::=sh4down::or::stream.releaseGroup::=shaka::or::stream.releaseGroup::=shelby::or::stream.releaseGroup::=sherlock::or::stream.releaseGroup::=sigla::or::stream.releaseGroup::=spaghettimancer::or::stream.releaseGroup::=tars::or::stream.releaseGroup::=thr::or::stream.releaseGroup::=tijuco::or::stream.releaseGroup::=tossato::or::stream.releaseGroup::=troidex::or::stream.releaseGroup::=tupac::or::stream.releaseGroup::=upd::or::stream.releaseGroup::=vnlls::or::stream.releaseGroup::=witchhunter::or::stream.releaseGroup::=wtv::or::stream.releaseGroup::=wyrm::or::stream.releaseGroup::=xiquexique::or::stream.releaseGroup::=xprince00::or::stream.releaseGroup::=yatogam1::or::stream.releaseGroup::=zmg::or::stream.releaseGroup::=znm[\" / 🇧🇷\"||\"\"]}\n{stream.indexer::exists[\"📌 {stream.indexer}\"||\"\"]}{stream.releaseGroup::exists[\" 🏷️{stream.releaseGroup}\"||\"\"]}\n{stream.filename::exists[\"{stream.filename}\"||\"\"]}"
    }
  },
  "preferredQualities": [
    "BluRay",
    "WEB-DL",
    "WEBRip",
    "HDRip",
    "HC HD-Rip",
    "DVDRip",
    "HDTV",
    "CAM",
    "TS",
    "TC",
    "SCR",
    "Unknown",
    "BluRay REMUX"
  ],
  "preferredResolutions": [
    "2160p",
    "1440p",
    "1080p",
    "720p",
    "Unknown",
    "576p",
    "480p"
  ],
  "excludedQualities": [
    "CAM"
  ],
  "excludedVisualTags": [],
  "sortCriteria": {
    "global": [
      {
        "key": "keyword",
        "direction": "desc"
      },
      {
        "key": "streamExpressionMatched",
        "direction": "desc"
      },
      {
        "key": "language",
        "direction": "desc"
      },
      {
        "key": "cached",
        "direction": "desc"
      },
      {
        "key": "library",
        "direction": "desc"
      },
      {
        "key": "resolution",
        "direction": "desc"
      },
      {
        "key": "quality",
        "direction": "desc"
      }
    ],
    "movies": [],
    "series": [],
    "anime": [],
    "cached": [],
    "cachedMovies": []
  },
  "deduplicator": {
    "enabled": true,
    "multiGroupBehaviour": "conservative",
    "keys": [
      "filename",
      "infoHash",
      "smartDetect"
    ],
    "cached": "single_result",
    "uncached": "per_service",
    "p2p": "disabled",
    "excludeAddons": []
  },
  "proxy": {
    "id": "mediaflow",
    "proxiedAddons": [
      "f1b"
    ],
    "proxiedServices": []
  },
  "trusted": false,
  "addonName": "AIO PT-BR",
  "addonDescription": "AIOStreams configurado para priorizar conteudo dublado em PT-BR.",
  "excludedResolutions": [],
  "includedResolutions": [],
  "requiredResolutions": [],
  "includedQualities": [],
  "requiredQualities": [],
  "excludedLanguages": [],
  "includedLanguages": [],
  "requiredLanguages": [
    "Portuguese",
    "Multi",
    "Dual Audio",
    "Dubbed",
    "Unknown"
  ],
  "preferredLanguages": [
    "Portuguese",
    "Multi",
    "Dubbed",
    "Dual Audio",
    "Unknown"
  ],
  "includedVisualTags": [],
  "requiredVisualTags": [],
  "preferredVisualTags": [],
  "excludedAudioTags": [],
  "includedAudioTags": [],
  "requiredAudioTags": [],
  "preferredAudioTags": [],
  "excludedAudioChannels": [],
  "includedAudioChannels": [],
  "requiredAudioChannels": [],
  "preferredAudioChannels": [],
  "excludedStreamTypes": [
    "p2p"
  ],
  "includedStreamTypes": [],
  "requiredStreamTypes": [],
  "preferredStreamTypes": [
    "debrid",
    "http"
  ],
  "excludedEncodes": [],
  "includedEncodes": [],
  "requiredEncodes": [],
  "preferredEncodes": [],
  "excludedRegexPatterns": [],
  "includedRegexPatterns": [],
  "requiredRegexPatterns": [],
  "preferredRegexPatterns": [],
  "requiredKeywords": [],
  "includedKeywords": [],
  "excludedKeywords": [],
  "preferredKeywords": [
    "riper",
    "bioma",
    "alfahd",
    "c76",
    "pia",
    "sigla",
    "madruga",
    "ff",
    "pd",
    "yatogam1",
    "asy",
    "g4ris",
    "sh4down",
    "kallango",
    "upd",
    "100real",
    "wtv",
    "tars",
    "mdg",
    "cza",
    "tupac",
    "eck",
    "fly",
    "mlh",
    "amantedoharpia",
    "potatin",
    "lukas",
    "lucano22",
    "witchhunter",
    "c0ral"
  ],
  "excludeSeederRange": [
    0,
    1000
  ],
  "requiredSeederRange": [
    1,
    1000
  ],
  "seederRangeTypes": [
    "uncached"
  ],
  "ageRangeTypes": [
    "usenet"
  ],
  "excludeCached": false,
  "excludeCachedFromAddons": [],
  "excludeCachedFromServices": [],
  "excludeCachedFromStreamTypes": [],
  "excludeUncached": false,
  "excludeUncachedFromAddons": [],
  "excludeUncachedFromServices": [],
  "excludeUncachedFromStreamTypes": [],
  "excludedStreamExpressions": [],
  "requiredStreamExpressions": [],
  "preferredStreamExpressions": [
    "indexer(streams, 'BluDV', 'Comando', 'DarkMahou', 'EraiRaws', 'Keroseed', 'NyaaSi', 'RedeTorrent', 'TorrentDosFilmes', 'VacaTorrent', 'RedeTorrent', 'ApacheTorrent', 'Stark' )",
    "releaseGroup(streams, '100real', '3lton', 'aconduta', 'adamantium', 'alfahd', 'AndreTPF', 'amantedoharpia', 'anonimo', 'anonymous07', 'asm', 'asy', 'azx', 'bad', 'bdc', 'big', 'BiOMA', 'bnd', 'brhd', 'byoutou', 'C.A.A', 'c0ral', 'c76', 'cbr', 'cory', 'cza', 'dalmaciojr', 'DKS', 'dm', 'elm4g0', 'emmid', 'eri', 'estagiario', 'extr3muss', 'fantasma223', 'ff', 'fido', 'filehd', 'fly', 'foxx', 'franzopl', 'freddiegellar', 'FreedomHD', 'g4ris', 'gmn', 'got', 'gris', 'gueira', 'izards', 'jk', 'joekerr', 'jus', 'kallango', 'lapumia', 'lcd', 'lmb', 'ltda', 'lucano22', 'lukas', 'madruga', 'master', 'mdg', 'mlh', 'n3g4n', 'nex', 'nous3r', 'ntz', 'olympus', 'oscarniemeyer', 'pd', 'pia', 'piratadigital', 'plushd', 'potatin', 'princeputt20', 'Professor_X', 'RARBR', 'riper', 'rk', 'rlee', 'sacerdoti', 'sgf', 'sh4down', 'shaka', 'shelby', 'sherlock', 'sigla', 'spaghettimancer', 'tars', 'thr', 'tijuco', 'tossato', 'troidex', 'tupac', 'upd', 'vnlls', 'witchhunter', 'WTV', 'WYRM', 'xiquexique', 'xprince00', 'yatogam1', 'zmg', 'znm' )"
  ],
  "includedStreamExpressions": [],
  "dynamicAddonFetching": {
    "enabled": false,
    "condition": ""
  },
  "groups": {
    "enabled": false,
    "groupings": [],
    "behaviour": "sequential"
  },
  "resultLimits": {
    "addon": 6
  },
  "size": {
    "global": {
      "movies": [
        0,
        100000000000
      ],
      "series": [
        0,
        100000000000
      ]
    }
  },
  "hideErrors": true,
  "hideErrorsForResources": [],
  "statistics": {
    "enabled": true,
    "position": "bottom",
    "statsToShow": [
      "addon"
    ]
  },
  "yearMatching": {
    "requestTypes": [],
    "addons": []
  },
  "titleMatching": {
    "enabled": false,
    "requestTypes": [
      "movie",
      "series"
    ],
    "addons": []
  },
  "seasonEpisodeMatching": {
    "enabled": false,
    "strict": true,
    "requestTypes": [
      "movie",
      "series"
    ],
    "addons": []
  },
  "autoPlay": {
    "enabled": true,
    "attributes": [
      "service",
      "proxied",
      "resolution",
      "quality",
      "encode",
      "audioTags",
      "visualTags",
      "languages",
      "releaseGroup"
    ]
  },
  "precacheNextEpisode": true,
  "alwaysPrecache": true,
  "catalogModifications": [
    {
      "id": "6d5e3b0.tmdb.top",
      "name": "Popular",
      "type": "movie",
      "enabled": true,
      "shuffle": false,
      "rpdb": true,
      "hideable": true,
      "searchable": false,
      "addonName": "The Movie Database"
    },
    {
      "id": "6d5e3b0.tmdb.top",
      "name": "Popular",
      "type": "series",
      "enabled": true,
      "shuffle": false,
      "rpdb": true,
      "hideable": true,
      "searchable": false,
      "addonName": "The Movie Database"
    },
    {
      "id": "6d5e3b0.tmdb.trending",
      "name": "Tendências",
      "type": "movie",
      "enabled": true,
      "shuffle": false,
      "rpdb": true,
      "hideable": true,
      "searchable": false,
      "addonName": "The Movie Database"
    },
    {
      "id": "6d5e3b0.tmdb.trending",
      "name": "Tendências",
      "type": "series",
      "enabled": true,
      "shuffle": false,
      "rpdb": true,
      "hideable": true,
      "searchable": false,
      "addonName": "The Movie Database"
    },
    {
      "id": "6d5e3b0.streaming.nfx",
      "name": "Netflix",
      "type": "movie",
      "enabled": true,
      "shuffle": false,
      "rpdb": true,
      "hideable": true,
      "searchable": false,
      "addonName": "The Movie Database"
    },
    {
      "id": "6d5e3b0.streaming.nfx",
      "name": "Netflix",
      "type": "series",
      "enabled": true,
      "shuffle": false,
      "rpdb": true,
      "hideable": true,
      "searchable": false,
      "addonName": "The Movie Database"
    },
    {
      "id": "6d5e3b0.streaming.hbm",
      "name": "HBO Max",
      "type": "movie",
      "enabled": true,
      "shuffle": false,
      "rpdb": true,
      "hideable": true,
      "searchable": false,
      "addonName": "The Movie Database"
    },
    {
      "id": "6d5e3b0.streaming.hbm",
      "name": "HBO Max",
      "type": "series",
      "enabled": true,
      "shuffle": false,
      "rpdb": true,
      "hideable": true,
      "searchable": false,
      "addonName": "The Movie Database"
    },
    {
      "id": "6d5e3b0.streaming.dnp",
      "name": "Disney+",
      "type": "movie",
      "enabled": true,
      "shuffle": false,
      "rpdb": true,
      "hideable": true,
      "searchable": false,
      "addonName": "The Movie Database"
    },
    {
      "id": "6d5e3b0.streaming.dnp",
      "name": "Disney+",
      "type": "series",
      "enabled": true,
      "shuffle": false,
      "rpdb": true,
      "hideable": true,
      "searchable": false,
      "addonName": "The Movie Database"
    },
    {
      "id": "6d5e3b0.streaming.amp",
      "name": "Prime Video",
      "type": "movie",
      "enabled": true,
      "shuffle": false,
      "rpdb": true,
      "hideable": true,
      "searchable": false,
      "addonName": "The Movie Database"
    },
    {
      "id": "6d5e3b0.streaming.amp",
      "name": "Prime Video",
      "type": "series",
      "enabled": true,
      "shuffle": false,
      "rpdb": true,
      "hideable": true,
      "searchable": false,
      "addonName": "The Movie Database"
    },
    {
      "id": "6d5e3b0.streaming.pmp",
      "name": "Paramount+",
      "type": "movie",
      "enabled": true,
      "shuffle": false,
      "rpdb": true,
      "hideable": true,
      "searchable": false,
      "addonName": "The Movie Database"
    },
    {
      "id": "6d5e3b0.streaming.pmp",
      "name": "Paramount+",
      "type": "series",
      "enabled": true,
      "shuffle": false,
      "rpdb": true,
      "hideable": true,
      "searchable": false,
      "addonName": "The Movie Database"
    },
    {
      "id": "6d5e3b0.streaming.atp",
      "name": "Apple TV+",
      "type": "movie",
      "enabled": true,
      "shuffle": false,
      "rpdb": true,
      "hideable": true,
      "searchable": false,
      "addonName": "The Movie Database"
    },
    {
      "id": "6d5e3b0.streaming.atp",
      "name": "Apple TV+",
      "type": "series",
      "enabled": true,
      "shuffle": false,
      "rpdb": true,
      "hideable": true,
      "searchable": false,
      "addonName": "The Movie Database"
    },
    {
      "id": "6d5e3b0.streaming.gop",
      "name": "Globoplay",
      "type": "movie",
      "enabled": true,
      "shuffle": false,
      "rpdb": true,
      "hideable": true,
      "searchable": false,
      "addonName": "The Movie Database"
    },
    {
      "id": "6d5e3b0.streaming.cru",
      "name": "Crunchyroll",
      "type": "movie",
      "enabled": true,
      "shuffle": false,
      "rpdb": true,
      "hideable": true,
      "searchable": false,
      "addonName": "The Movie Database"
    },
    {
      "id": "6d5e3b0.streaming.gop",
      "name": "Globoplay",
      "type": "series",
      "enabled": true,
      "shuffle": false,
      "rpdb": true,
      "hideable": true,
      "searchable": false,
      "addonName": "The Movie Database"
    },
    {
      "id": "6d5e3b0.streaming.cru",
      "name": "Crunchyroll",
      "type": "series",
      "enabled": true,
      "shuffle": false,
      "rpdb": true,
      "hideable": true,
      "searchable": false,
      "addonName": "The Movie Database"
    },
    {
      "id": "6d5e3b0.tmdb.search",
      "name": "Search",
      "type": "movie",
      "enabled": true,
      "shuffle": false,
      "rpdb": true,
      "hideable": false,
      "searchable": false,
      "addonName": "The Movie Database"
    },
    {
      "id": "6d5e3b0.tmdb.search",
      "name": "Search",
      "type": "series",
      "enabled": true,
      "shuffle": false,
      "rpdb": true,
      "hideable": false,
      "searchable": false,
      "addonName": "The Movie Database"
    },
    {
      "id": "3ace3b0.kitsu-anime-trending",
      "type": "anime",
      "name": "Kitsu Trending",
      "shuffle": false,
      "onlyOnDiscover": true,
      "enabled": true,
      "rpdb": true,
      "hideable": true,
      "searchable": false,
      "addonName": "Anime Kitsu"
    },
    {
      "id": "3ace3b0.kitsu-anime-airing",
      "type": "anime",
      "name": "Kitsu Top Airing",
      "shuffle": false,
      "onlyOnDiscover": false,
      "enabled": true,
      "rpdb": true,
      "hideable": true,
      "searchable": false,
      "addonName": "Anime Kitsu"
    },
    {
      "id": "3ace3b0.kitsu-anime-popular",
      "type": "anime",
      "name": "Kitsu Most Popular",
      "shuffle": false,
      "onlyOnDiscover": true,
      "enabled": true,
      "rpdb": true,
      "hideable": true,
      "searchable": false,
      "addonName": "Anime Kitsu"
    },
    {
      "id": "3ace3b0.kitsu-anime-rating",
      "type": "anime",
      "name": "Kitsu Highest Rated",
      "shuffle": false,
      "onlyOnDiscover": true,
      "enabled": true,
      "rpdb": true,
      "hideable": true,
      "searchable": false,
      "addonName": "Anime Kitsu"
    },
    {
      "id": "3ace3b0.kitsu-anime-list",
      "type": "anime",
      "name": "Kitsu",
      "shuffle": false,
      "enabled": true,
      "rpdb": true,
      "hideable": false,
      "searchable": false,
      "addonName": "Anime Kitsu"
    }
  ],
  "externalDownloads": false,
  "cacheAndPlay": {
    "streamTypes": [
      "usenet",
      "torrent"
    ]
  },
  "addonLogo": "data:image/jpeg;base64,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"
}

// ============================================================
// 3. ROTAS DE DOWNLOAD DE ARQUIVOS
// ============================================================

// Rota única para baixar a configuração completa
app.get('/download/aiostreams-config.json', (req, res) => {
    res.setHeader('Content-Disposition', 'attachment; filename="aiostreams-config-PT-BR.json"');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(AIO_CONFIG_JSON, null, 2));
});

// ============================================================
// 4. ROTA MANIFESTO (Proxy)
// ============================================================
app.get('/addon/manifest.json', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=60'); 
    
    try {
        const customName = req.query.name || DEFAULT_NAME;
        const customLogo = req.query.logo || DEFAULT_LOGO;
        
        const response = await axios.get(`${UPSTREAM_BASE}/manifest.json`);
        const manifest = response.data;

        const idSuffix = Buffer.from(customName).toString('hex').substring(0, 10);
        
        manifest.id = `community.brazuca.wrapper.${idSuffix}`;
        manifest.name = customName; 
        manifest.description = `Wrapper customizado: ${customName}`;
        manifest.logo = customLogo;
        manifest.version = PROJECT_VERSION; 
        
        delete manifest.background; 
        
        res.json(manifest);
    } catch (error) {
        console.error("Upstream manifesto error:", error.message);
        res.status(500).json({ error: "Upstream manifesto error" });
    }
});

// ============================================================
// 5. ROTA REDIRECIONADORA
// ============================================================
app.get('/addon/*', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const originalPath = req.url.replace('/addon', '');
    const upstreamUrl = `${UPSTREAM_BASE}${originalPath}`;
    
    if (originalPath.startsWith('/stream/')) {
        res.setHeader('Content-Type', 'application/json');
        try {
            const response = await axios.get(upstreamUrl);
            let streams = response.data.streams || [];
            return res.json({ streams: streams });
        } catch (error) {
            console.error("Stream Fetch Error:", error.message);
            return res.status(404).json({ streams: [] }); 
        }
    }
    res.redirect(307, upstreamUrl);
});


// ============================================================
// 6. INTERFACE DO GERADOR
// ============================================================
const generatorHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Brazuca Wrapper</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="/_vercel/insights/script.js"></script> 
    <style>
        body { background-color: #0a0a0a; color: #e5e5e5; font-family: sans-serif; }
        .card { background-color: #141414; border: 1px solid #262626; }
        .input-dark { background-color: #0a0a0a; border: 1px solid #333; color: white; transition: 0.2s; }
        .input-dark:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); }
        
        .btn-action { 
            background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%); 
            color: white; font-weight: bold; 
            transition: all 0.3s ease;
        }
        
        .btn-sub { font-weight: 600; font-size: 0.8rem; padding: 10px; border-radius: 0.5rem; border: 1px solid; text-align: center; display: block; transition: 0.2s; }
        .btn-sub-tb { background: #008000; color: white; border-color: #006400; } 
        .btn-sub-rd { background: #2563eb; color: white; border-color: #1e40af; } 
        .btn-sub-tb:hover { background: #32cd32; }
        .btn-sub-rd:hover { background: #1e40af; }

        .btn-file {
            background: #1f2937; color: #9ca3af; border: 1px solid #374151;
            font-size: 0.75rem; padding: 8px 12px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; transition: 0.2s; text-decoration: none;
        }
        .btn-file:hover { background: #374151; color: white; border-color: #4b5563; }
        
        .divider { border-top: 1px solid #262626; margin: 25px 0; position: relative; }
        .input-container { margin-bottom: 1.5rem; }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4 bg-black">

    <div class="w-full max-w-lg card rounded-2xl shadow-2xl p-6 border border-gray-800 relative">
        
        <!-- Header -->
        <div class="text-center mb-8">
            <img src="https://i.imgur.com/KVpfrAk.png" id="previewLogo" class="w-20 h-20 mx-auto mb-3 rounded-full border-2 border-gray-800 shadow-lg object-cover">
            <h1 class="text-3xl font-extrabold text-white tracking-tight">Brazuca <span class="text-blue-500">Wrapper</span></h1>
            <p class="text-gray-500 text-xs mt-1 uppercase tracking-widest">GERADOR STREMTHRU V${PROJECT_VERSION}</p>
        </div>

        <form class="space-y-6">
            
            <!-- 1. Instância -->
            <div class="hidden">
                <label class="text-xs font-bold text-gray-500 uppercase ml-1">1. Servidor (Bridge)</label>
                <select id="instance" class="w-full input-dark p-3 rounded-lg text-sm mt-1 cursor-pointer">
                    <option value="${STREMTHRU_HOST}">Midnight</option>
                </select>
            </div>

            <!-- Personalização -->
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="text-[10px] font-bold text-gray-500 uppercase">Nome do Addon</label>
                    <input type="text" id="custom_name" value="${DEFAULT_NAME}" class="w-full input-dark p-2 rounded text-sm mt-1">
                </div>
                <div>
                    <label class="text-[10px] font-bold text-gray-500 uppercase">Ícone (URL)</label>
                    <input type="text" id="custom_logo" value="${DEFAULT_LOGO}" class="w-full input-dark p-2 rounded text-sm mt-1" onchange="updatePreview()">
                </div>
            </div>

            <!-- 2. Fontes Extras -->
            <div class="divider"></div>
            <div class="space-y-3">
                <label class="text-xs font-bold text-gray-500 uppercase ml-1">2. Fontes de Torrent</label>
                
                <div class="bg-[#161616] p-3 rounded border border-gray-800">
                    <label class="flex items-center gap-3">
                        <span class="text-sm font-bold text-gray-300">✔ Brazuca (Default)</span>
                    </label>
                </div>
                
                 <div class="bg-[#161616] p-3 rounded border border-gray-800">
                    <label class="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" id="use_torrentio" checked class="w-4 h-4 accent-red-600" onchange="validate()">
                        <span class="text-sm font-bold text-gray-300">Incluir Torrentio (PT/BR)</span>
                    </label>
                    <p class="text-[10px] text-gray-500 mt-1 ml-1">Torrentio Customizado incluso para resultados em português/BR.</p>
                </div>
            </div>

            <!-- 3. Debrids (Tokens) -->
            <div class="divider"></div>
            
            <div class="space-y-6">
                
                <!-- TORBOX -->
                <div class="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800">
                    <div class="flex items-center gap-2 mb-4">
                        <input type="checkbox" id="use_tb" class="w-5 h-5 accent-purple-600 cursor-pointer" onchange="validate()">
                        <span class="text-sm font-bold text-white">TorBox</span>
                    </div>
                    
                    <div class="input-container">
                        <input type="text" id="tb_key" placeholder="Cole sua API KEY" class="w-full input-dark px-4 py-3 rounded-lg text-sm">
                    </div>
                    
                    <div class="grid grid-cols-1 gap-3">
                        <a href="https://torbox.app/subscription?referral=${REFERRAL_TB}" target="_blank" class="btn-sub btn-sub-tb w-full shadow-lg shadow-purple-900/20 text-center font-bold">
                            Assinar TorBox <i class="fas fa-external-link-alt ml-2"></i>
                        </a>
                        <p class="text-xs text-center text-green-400 mt-1">Ganhe 7 dias extras/mês ou 84 dias por 1 ano assinado: <span id="tb_ref_code" class="font-mono text-xs cursor-pointer select-all underline" onclick="copyRefCode('${REFERRAL_TB}')">Copiar Código</span></p>
                    </div>
                </div>

                <!-- REAL DEBRID (REMOVIDO) -->
            </div>

            <!-- Resultado -->
            <div id="resultArea" class="hidden pt-4 border-t border-gray-800 space-y-3">
                <div class="relative">
                    <input type="text" id="finalUrl" readonly class="w-full bg-black border border-blue-900 text-blue-400 text-[10px] p-3 rounded pr-12 font-mono outline-none">
                    <button type="button" onclick="copyLink()" class="absolute right-1 top-1 bottom-1 bg-blue-900 hover:bg-blue-800 text-white px-3 rounded text-xs font-bold transition">COPY</button>
                </div>
                
                <a id="installBtn" href="#" class="block w-full btn-action py-3.5 rounded-xl text-center font-bold text-sm uppercase tracking-widest shadow-lg">
                    INSTALAR AGORA
                </a>
            </div>

            <button type="button" onclick="generate()" id="btnGenerate" class="w-full bg-gray-800 text-gray-500 py-3.5 rounded-xl text-sm font-bold cursor-not-allowed transition" disabled>
                GERAR CONFIGURAÇÃO
            </button>
            
            <!-- EXTRAS AIOSTREAMS -->
            <div class="mt-8 pt-6 border-t border-gray-800">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider">Extras: AIOStreams (PT-BR)</h3>
                    <span class="bg-purple-900/30 text-purple-400 text-[10px] px-2 py-0.5 rounded border border-purple-900">Recomendado</span>
                </div>
                
                <div class="bg-[#111] p-4 rounded-xl border border-gray-800">
                    <p class="text-xs text-gray-500 mb-3 leading-relaxed">
                        Configure o <b>AIOStreams</b> com foco em conteúdo brasileiro usando o arquivo de configuração abaixo.
                    </p>
                    
                    <div class="mb-3">
                        <a href="/download/aiostreams-config.json" class="btn-file w-full" download>
                            <i class="fas fa-file-code text-blue-400 mr-2"></i> Baixar Configuração Completa
                        </a>
                    </div>
                    
                    <a href="https://aiostreamsfortheweebsstable.midnightignite.me/stremio/configure?menu=save-install" target="_blank" class="block w-full bg-[#1f2937] hover:bg-[#374151] text-gray-300 hover:text-white font-medium text-xs py-2.5 rounded-lg text-center transition border border-gray-700">
                        Abrir AIOStreams (Midnight) <i class="fas fa-external-link-alt ml-1 text-[10px]"></i>
                    </a>
                </div>
            </div>

        </form>
    </div>

    <div id="toast" class="fixed bottom-5 right-5 bg-green-600 text-white px-4 py-2 rounded shadow-lg hidden">Link Copiado!</div>

    <script>
        const STREMTHRU_HOST = "${STREMTHRU_HOST}";
        const REFERRAL_TB = "${REFERRAL_TB}";
        const TORRENTIO_PT_URL = "${TORRENTIO_PT_URL}";

        function updatePreview() {
            const url = document.getElementById('custom_logo').value.trim();
            if(url) document.getElementById('previewLogo').src = url;
        }

        function validate() {
            const tb = document.getElementById('use_tb').checked;
            const tbInput = document.getElementById('tb_key');
            const btn = document.getElementById('btnGenerate');

            tbInput.disabled = !tb;
            tbInput.parentElement.style.opacity = tb ? '1' : '0.5';

            if(!tb) tbInput.value = '';
            
            const isValid = (tb && tbInput.value.trim().length > 5);

            if(isValid) {
                btn.classList.replace('bg-gray-800', 'btn-action');
                btn.classList.replace('text-gray-500', 'text-white');
                btn.classList.remove('cursor-not-allowed');
                btn.disabled = false;
            } else {
                btn.classList.replace('btn-action', 'bg-gray-800');
                btn.classList.replace('text-white', 'text-gray-500');
                btn.classList.add('cursor-not-allowed');
                btn.disabled = true;
            }
        }

        document.getElementById('tb_key').addEventListener('input', validate);

        function generate() {
            let host = STREMTHRU_HOST;
            host = host.replace(/\\/$/, '').replace('http:', 'https:');
            if (!host.startsWith('http')) host = 'https://' + host;

            const cName = document.getElementById('custom_name').value.trim();
            const cLogo = document.getElementById('custom_logo').value.trim();
            const useTorrentio = document.getElementById('use_torrentio').checked;
            
            const finalName = cName || "BR"; 

            let proxyParams = \`?name=\${encodeURIComponent(finalName)}\`;
            if(cLogo) proxyParams += \`&logo=\${encodeURIComponent(cLogo)}\`;

            const myMirrorUrl = window.location.origin + "/addon/manifest.json" + proxyParams + "&t=" + Date.now();

            let config = { upstreams: [], stores: [] };
            
            // 1. Adiciona o Brazuca Customizado (Nosso Proxy)
            config.upstreams.push({ u: myMirrorUrl });
            
            // 2. Adiciona o Torrentio PT (PADRÃO)
            if (useTorrentio) {
                config.upstreams.push({ u: TORRENTIO_PT_URL });
            }
            
            // 3. Debrids (Tokens)
            if (document.getElementById('use_tb').checked) {
                config.stores.push({ c: "tb", t: document.getElementById('tb_key').value.trim() });
            }

            const b64 = btoa(JSON.stringify(config));
            
            const hostClean = host.replace(/^https?:\\/\\//, '');
            const httpsUrl = \`\${host}/stremio/wrap/\${b64}/manifest.json\`;
            const stremioUrl = \`stremio://\${hostClean}/stremio/wrap/\${b64}/manifest.json\`; 

            document.getElementById('finalUrl').value = httpsUrl;
            document.getElementById('installBtn').href = stremioUrl;
            
            document.getElementById('btnGenerate').classList.add('hidden');
            document.getElementById('resultArea').classList.remove('hidden');
        }

        function copyLink() {
            const el = document.getElementById('finalUrl');
            el.select();
            document.execCommand('copy');
            const btn = document.querySelector('button[onclick="copyLink()"]');
            const oldTxt = btn.innerText;
            btn.innerText = "LINK COPIADO!";
            setTimeout(() => btn.innerText = oldTxt, 1500);
        }

        function copyRefCode(code) {
            navigator.clipboard.writeText(code).then(() => {
                const toast = document.getElementById('toast');
                toast.innerText = "CÓDIGO COPIADO!";
                toast.classList.remove('hidden');
                setTimeout(() => toast.classList.add('hidden'), 2000);
            });
        }
    </script>
</body>
</html>
`;

// Rota Principal (Servir HTML)
app.get('/', (req, res) => res.send(generatorHtml));
app.get('/configure', (req, res) => res.send(generatorHtml));

// Rota do Manifesto (Proxy)
app.get('/addon/manifest.json', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=60'); 
    
    try {
        const customName = req.query.name || DEFAULT_NAME;
        const customLogo = req.query.logo || DEFAULT_LOGO;
        
        const response = await axios.get(`${UPSTREAM_BASE}/manifest.json`);
        const manifest = response.data;

        const idSuffix = Buffer.from(customName).toString('hex').substring(0, 10);
        
        manifest.id = `community.brazuca.wrapper.${idSuffix}`;
        manifest.name = customName; 
        manifest.description = `Wrapper customizado: ${customName}`;
        manifest.logo = customLogo;
        manifest.version = PROJECT_VERSION; 
        
        delete manifest.background; 
        
        res.json(manifest);
    } catch (error) {
        console.error("Upstream manifesto error:", error.message);
        res.status(500).json({ error: "Upstream manifesto error" });
    }
});

// Rotas de Redirecionamento (Streams/Catálogos)
app.get('/addon/stream/:type/:id.json', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    try {
        const upstreamUrl = `${UPSTREAM_BASE}${req.path}`;
        const response = await axios.get(upstreamUrl);
        let streams = response.data.streams || [];

        return res.json({ streams: streams });

    } catch (error) {
        console.error("Stream Fetch Error:", error.message);
        return res.status(404).json({ streams: [] }); 
    }
});

// Redireciona todos os outros recursos (catálogos, meta, etc.)
app.get('/addon/*', (req, res) => {
    const originalPath = req.url.replace('/addon', '');
    const upstreamUrl = `${UPSTREAM_BASE}${originalPath}`;
    res.redirect(307, upstreamUrl);
});


// Exporta a aplicação para o Vercel Serverless
const PORT = process.env.PORT || 7000;
if (process.env.VERCEL) {
    module.exports = app;
} else {
    app.listen(PORT, () => {
        console.log(`Gerador rodando na porta ${PORT}`);
    });
}
