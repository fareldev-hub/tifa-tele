# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.0.20](https://github.com/bluelovers/ws-http/compare/lazy-url@1.0.19...lazy-url@1.0.20) (2021-08-30)


### ♻️　Chores

* **deps:** update deps ([1059c18](https://github.com/bluelovers/ws-http/commit/1059c182fec67f5cd0d13c12143f52d88c18225a))





## 1.0.19 (2021-08-16)


### 🔖　Miscellaneous

* . ([2551b02](https://github.com/bluelovers/ws-http/commit/2551b0240b15a24c0853d17221a16077934c9ff1))
* Add 'packages/lazy-url/' from commit '41268c521048ba4880494d79cd9a11a4d7e4e005' ([e3f4ed3](https://github.com/bluelovers/ws-http/commit/e3f4ed3c434ae1e007d19b75e2b4058cbbca3d64))





## [1.0.18](https://github.com/bluelovers/lazy-url/compare/lazy-url@1.0.17...lazy-url@1.0.18) (2021-08-11)


### 🐛　Bug Fixes

* Cannot read property 'length' of undefined ([236d019](https://github.com/bluelovers/lazy-url/commit/236d019c102a1a4173eed566f79b82a38e2891c2))





## [1.0.17](https://github.com/bluelovers/lazy-url/compare/lazy-url@1.0.16...lazy-url@1.0.17) (2021-08-11)


### 🐛　Bug Fixes

* Cannot read property 'split' of undefined ([24d33a5](https://github.com/bluelovers/lazy-url/commit/24d33a553f8784772aac3f5d35715aba23518978))





## [1.0.16](https://github.com/bluelovers/lazy-url/compare/lazy-url@1.0.15...lazy-url@1.0.16) (2021-08-11)


### ✨　Features

* add `get` , `set` ([7e35eb8](https://github.com/bluelovers/lazy-url/commit/7e35eb804b120bd62eec235df76a9a1bbe802b71))





## [1.0.15](https://github.com/bluelovers/lazy-url/compare/lazy-url@1.0.14...lazy-url@1.0.15) (2021-08-11)


### ✨　Features

* support auth ([8e537fe](https://github.com/bluelovers/lazy-url/commit/8e537fe258660844f5b22d2abd5306ef91feb0ea))


### 🚨　Tests

* update test ([e530690](https://github.com/bluelovers/lazy-url/commit/e53069062dfde7e9b34fc2326370c36887e336e5))





## [1.0.14](https://github.com/bluelovers/lazy-url/compare/lazy-url@1.0.13...lazy-url@1.0.14) (2021-08-11)


### 📦　Code Refactoring

* update error ([1faa913](https://github.com/bluelovers/lazy-url/commit/1faa91392e2fc910990f89f65030b87d9ee2fce1))





## [1.0.13](https://github.com/bluelovers/lazy-url/compare/lazy-url@1.0.12...lazy-url@1.0.13) (2021-08-11)


### 🐛　Bug Fixes

* avoid `origin` to be `null` https://github.com/nodejs/node/issues/39732#issuecomment-896624653 ([4e03764](https://github.com/bluelovers/lazy-url/commit/4e03764c00aa5535685694e7a1f0ff84c9f2023f)), closes [/github.com/nodejs/node/issues/39732#issuecomment-896624653](https://github.com//github.com/nodejs/node/issues/39732/issues/issuecomment-896624653)
* origin should not be `null` https://github.com/nodejs/node/issues/39732#issuecomment-896624653 ([7780cbc](https://github.com/bluelovers/lazy-url/commit/7780cbc06691ec7242846c38d399cc96c3d1ef2a)), closes [/github.com/nodejs/node/issues/39732#issuecomment-896624653](https://github.com//github.com/nodejs/node/issues/39732/issues/issuecomment-896624653)
* href is undefined ([5116455](https://github.com/bluelovers/lazy-url/commit/511645592f06a693f2c22c3ef8c91c3a92421a20))
* **protocol:** avoid bug of https://github.com/nodejs/node/issues/39732 ([7d03026](https://github.com/bluelovers/lazy-url/commit/7d03026e1cab6a052a09b2dccfcbd2fde8ce0001))


### ✨　Features

* detect fake after set href ([72f15fc](https://github.com/bluelovers/lazy-url/commit/72f15fc191cb8e45924d00439ecfc719a71e7c46))


### 🚨　Tests

* **url-parse:** update snapshot https://github.com/unshiftio/url-parse/commit/fb128af4f43fa17f351d50cf615c7598c751f50a ([8d9f2de](https://github.com/bluelovers/lazy-url/commit/8d9f2dedc2cd4fdc5ea56de2d6c9bf75fbd86d5c))


### ♻️　Chores

* **deps:** update deps ([7121272](https://github.com/bluelovers/lazy-url/commit/7121272f8d583583863a843926b0fedea17061d2))





## [1.0.12](https://github.com/bluelovers/lazy-url/compare/lazy-url@1.0.11...lazy-url@1.0.12) (2021-07-19)


### 🔖　Miscellaneous

* update readme ([37dd3d6](https://github.com/bluelovers/lazy-url/commit/37dd3d6666d08cd73caea346cb29168500ebe697))





## 1.0.11 (2021-07-19)


### ✨　Features

* allow set port by number ([e359c04](https://github.com/bluelovers/lazy-url/commit/e359c0445bc41b1411075d45238d54d91f56dc0d))
* update types and test ([1b17181](https://github.com/bluelovers/lazy-url/commit/1b17181f1bdadf510d264be62d2a971eda5c154e))


### 📦　Code Refactoring

* wrap error, allow set port by number, fix error check ([3ca664b](https://github.com/bluelovers/lazy-url/commit/3ca664b83aa59ffb924d0bd05edc81bb529c7bf4))


### 🛠　Build System

* use `tslib` and `override` ([12778eb](https://github.com/bluelovers/lazy-url/commit/12778ebc485801e5c45c87f4cccf12ad33b56a7a))


### ⚙️　Continuous Integration

* coverage ([0fa5046](https://github.com/bluelovers/lazy-url/commit/0fa50463f4c274d4d7791b6fc1ce59eb45ecba42))


### ♻️　Chores

* **release:** publish ([7246071](https://github.com/bluelovers/lazy-url/commit/7246071743d7540aa4f29209f40072e728c11480))
* **release:** publish ([e66f333](https://github.com/bluelovers/lazy-url/commit/e66f3331417e4a77ee6e18d4677b95684637a50b))


### 🔖　Miscellaneous

* publish new version ([fb225c4](https://github.com/bluelovers/lazy-url/commit/fb225c4b5a70f5c2cfb17941b575e3f3e5a068c3))
* publish new version ([482b120](https://github.com/bluelovers/lazy-url/commit/482b1208c29d95ac6d5fd4654804919999e1f056))
* publish new version ([d503a0d](https://github.com/bluelovers/lazy-url/commit/d503a0d666af25889c41c61d089b8d031f42bc97))
* publish new version ([5789f65](https://github.com/bluelovers/lazy-url/commit/5789f65dbd732d0ab4bd6428d61a3583708e6c5a))
* publish new version ([f612118](https://github.com/bluelovers/lazy-url/commit/f612118fc0c8416f1f1bae8d0221c3bb4d2b6fa4))
* publish new version ([99b5dfe](https://github.com/bluelovers/lazy-url/commit/99b5dfe70b8c02ded7099f2067651538475b87eb))
* publish new version ([9ffee4e](https://github.com/bluelovers/lazy-url/commit/9ffee4e03fce907cef9e78f8b9320220979e9d85))
* publish new version ([25b6c4d](https://github.com/bluelovers/lazy-url/commit/25b6c4d7c3b499a2dd57b18385c73bb963c98b0a))
* publish new version ([6174b33](https://github.com/bluelovers/lazy-url/commit/6174b33ff0f0c3f9d6257a9e1543331e2aa27dc2))
