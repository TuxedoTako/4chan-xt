.PHONY: update clean hardclean build script chromium stable

# Updates npm packages
update:
	@echo "Updating the repository..."
	npm install --save-dev $(shell node tools/unpinned.js)
	npm install
	@echo "Done."

# Clean. remove beta-build files and tmp files
clean:
	@echo "Cleaning the repository..."
	rm -rf tmp tmp-crx testbuilds .events builds/test .test_enabled

# Runs clean and removes node_modules. Essentially like a fresh install
hardclean: clean
	@echo "Hard cleaning the repository..."
	rm -rf node_modules
	@echo "Done."

# Builds both the user script and the Chromium extension
build:
	@echo "Building the user script..."
	npm run build
	@echo "Done."

# This builds only the user script
script: 
	@echo "Building the user script..."
	npm run build:script
	@echo "Done."

# This builds only the Chromium extension
chromium:
	@echo "Building the Chromium extension..."
	npm run build:crx
	@echo "Done."

# This is more of a dev command as it moves the built files to the releases folder. It also builds them before moving them
stable: build
	tools/makeChromium.sh

# Default target
.DEFAULT_GOAL := build
