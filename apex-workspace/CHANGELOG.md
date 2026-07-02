## [1.3.1](https://github.com/Yvaloski/apex-assist/compare/v1.3.0...v1.3.1) (2026-07-02)


### Bug Fixes

* enrich system prompt dynamically to force tool call tag generation ([8d09876](https://github.com/Yvaloski/apex-assist/commit/8d098761b9cd085d132d09d22690bfd1ff1e3e37))

# [1.3.0](https://github.com/Yvaloski/apex-assist/compare/v1.2.0...v1.3.0) (2026-07-02)


### Features

* implement ReAct tool calling execution loop for filesystem and commands ([b22c7b5](https://github.com/Yvaloski/apex-assist/commit/b22c7b553a7c1a0543d4ecad183b9ad1f69c18c6))

# [1.2.0](https://github.com/Yvaloski/apex-assist/compare/v1.1.0...v1.2.0) (2026-07-02)


### Features

* add detailed voice diagnostics, dynamic language selection, and Chrome TTS keep-alive ([53a46d5](https://github.com/Yvaloski/apex-assist/commit/53a46d52e5c577d6b90c2ce38950b17213788309))

# [1.1.0](https://github.com/Yvaloski/apex-assist/compare/v1.0.0...v1.1.0) (2026-07-02)


### Bug Fixes

* update systeminformation jest mock for processes and add memory commands ([e605190](https://github.com/Yvaloski/apex-assist/commit/e60519085a30ef6a04207f0ecfe94d62a346f2b7))


### Features

* implement active processes monitor widget in HUD telemetry panel ([2c43ca6](https://github.com/Yvaloski/apex-assist/commit/2c43ca6bf1730823bc6da941069626f156b6857e))
* implement memory and skills injection, add TTS mute option, and strip markdown from speech ([0fe29e8](https://github.com/Yvaloski/apex-assist/commit/0fe29e8592ec63bf867268d5fc46f5ca4e9043a8))

# 1.0.0 (2026-07-02)


### Bug Fixes

* bypass WMI hang on Windows for RAM metrics by using native OS module ([98ff1d2](https://github.com/Yvaloski/apex-assist/commit/98ff1d23bf89b63b2f47dd612037480a8473e917))
* change color for metric bar ([03cf2b4](https://github.com/Yvaloski/apex-assist/commit/03cf2b453c46f07a07e35d35631317a3f7824849))
* display detailed error descriptions in HUD console on speech recognition failure ([7e8dcd0](https://github.com/Yvaloski/apex-assist/commit/7e8dcd052a0484036d77bd788af7556d3525c480))
* ehanced ui for apex core display ([89fadb2](https://github.com/Yvaloski/apex-assist/commit/89fadb2b1f0e0b6beed7653405412af42ed6c069))
* force speech recognition language to French (fr-FR) ([047ae3e](https://github.com/Yvaloski/apex-assist/commit/047ae3eefbfca4ce53c7d1c9b8b34ecff77ea1e5))
* resolve SpeechSynthesis queue hangs, integrate NgZone reactive sync, and fix unit tests ([cbd6047](https://github.com/Yvaloski/apex-assist/commit/cbd604723c4ec259a62a86fd3639c1bedaf99b6b))
* set speech recognition language to browser locale and add console feedback ([3a89b29](https://github.com/Yvaloski/apex-assist/commit/3a89b2980b1a0d1d99667bae220d3b2161def5ff))


### Features

* design immersive HUD/FUI with central reactive SVG orb and system telemetry gauges ([3e262ac](https://github.com/Yvaloski/apex-assist/commit/3e262ac7989e8cf3e6c657e985097a54534f9233))
* enable microphone access in Electron and customize TTS voice profile ([ae35220](https://github.com/Yvaloski/apex-assist/commit/ae3522085c26c959e122a48b12836112cd0192b8))
* implement NestJS backend gateway, Ollama integration, system monitor & Angular client services ([3939b5d](https://github.com/Yvaloski/apex-assist/commit/3939b5d0eb4f3fd1d456b066dd6b7c255dd6805e))
* implement real-time system metrics tracking and integrate Electron app ([91686cb](https://github.com/Yvaloski/apex-assist/commit/91686cb06be0d557a3e94410e832263f88fc7856))
* implement Web Audio API sound synthesis and sentence-by-sentence streaming Text-to-Speech ([3e1e340](https://github.com/Yvaloski/apex-assist/commit/3e1e340740560b9c81f4b64b96c3caca012dd852))
* init Nx monorepo with NestJS backend, Angular frontend & shared interfaces ([b895c13](https://github.com/Yvaloski/apex-assist/commit/b895c13631ab2b0513fa48c64ea6511abf9d4b1d))
