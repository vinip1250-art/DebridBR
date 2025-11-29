const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());

// ============================================================
// 1. CONFIGURAÇÕES PADRÃO
// ============================================================
const UPSTREAM_BASE = "https://94c8cb9f702d-brazuca-torrents.baby-beamup.club";
const DEFAULT_NAME = "BR"; 
const DEFAULT_LOGO = "https://i.imgur.com/KVpfrAk.png";
const PROJECT_VERSION = "1.0.0"; 
const STREMTHRU_HOST = "https://stremthrufortheweebs.midnightignite.me"; 

const REFERRAL_TB = "b08bcd10-8df2-44c9-a0ba-4d5bdb62ef96";

const TORRENTIO_PT_URL = "https://torrentio.strem.fun/providers=nyaasi,tokyotosho,anidex,comando,bludv,micoleaodublado|language=portuguese/manifest.json";

// ============================================================
// 2. CONTEÚDO AIOSTREAMS (CONFIGURAÇÃO)
// ============================================================
const AIO_CONFIG_JSON = {
  "services": [
    {
      "id": "torbox",
      "enabled": true,
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
  "addonName": "AIO",
  "addonDescription": "AIOmidnightignite",
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
    "enabled": true,
    "condition": "(((count(cached(totalStreams)) >= 5) and (count(resolution(cached(totalStreams), \"2160p\")) >= 2 or count(resolution(cached(totalStreams), \"1080p\")) >= 2) and (count(regexMatched(cached(totalStreams), \"REMUX\", \"BluRay\", \"WEB-DL\")) >= 2) and (count(cached(totalStreams)) - count(regexMatched(cached(totalStreams), \"Bad\")) >= 5)) or ((count(cached(totalStreams)) < 3) and (count(merge(language(cached(totalStreams), \"Portuguese\"), cached(totalStreams), language(uncached(totalStreams), \"Portuguese\"))) >= 5)) or (totalTimeTaken > 3000))"
  },
  "groups": {
    "enabled": false,
    "groupings": [],
    "behaviour": "sequential"
  },
  "rpdbApiKey": "<template_placeholder>",
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
  }
}
}
