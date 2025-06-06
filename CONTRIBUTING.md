# Contributing to INST Tag Visualizer

Thank you for your interest in contributing to the INST Tag Visualizer! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Types of Contributions

We welcome various types of contributions:

- 🐛 **Bug reports and fixes**
- ✨ **New features and enhancements**
- 📚 **Documentation improvements**
- 🧪 **Test coverage improvements**
- 🎨 **UI/UX improvements**
- 🔧 **Performance optimizations**
- 🌐 **Translation and localization**
- 📱 **Hardware integration examples**

### Before You Start

1. **Check existing issues** - Look through [existing issues](https://github.com/yourusername/inst-visualiser/issues) to see if your bug/feature is already being discussed
2. **Open an issue** - For new features or significant changes, please open an issue first to discuss the approach
3. **Read the docs** - Familiarize yourself with the [API documentation](docs/API.md) and [architecture](#architecture-overview)

## 🚀 Getting Started

### Development Environment Setup

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/yourusername/inst-visualiser.git
   cd inst-visualiser
   ```

2. **Install development dependencies**:
   ```bash
   npm install
   ```

3. **Start local development server**:
   ```bash
   npm start
   # Or use Python's built-in server
   python3 -m http.server 8080
   ```

4. **Open in browser**:
   ```
   http://localhost:8080
   ```

### Testing Your Changes

1. **Test with simulation data**:
   - Click "Start Simulation" to verify basic functionality
   - Click "Test Positioning" to test geometric layout

2. **Test MQTT connectivity** (if you have a broker):
   - Configure your MQTT settings
   - Publish test data using `examples/mqtt-publisher.py`

3. **Test browser compatibility**:
   - Chrome/Chromium 60+
   - Firefox 55+
   - Safari 11+
   - Edge 79+

4. **Run linting** (if available):
   ```bash
   npm run lint
   ```

## 📋 Development Guidelines

### Code Style

#### JavaScript
- Use **ES6+ features** where supported
- **Semicolons required**
- **4-space indentation**
- **Descriptive variable names**
- **JSDoc comments** for functions

```javascript
/**
 * Calculate distance between two nodes
 * @param {Object} node1 - First node with x,y coordinates
 * @param {Object} node2 - Second node with x,y coordinates
 * @returns {number} Distance in pixels
 */
function calculateDistance(node1, node2) {
    const dx = node2.x - node1.x;
    const dy = node2.y - node1.y;
    return Math.sqrt(dx * dx + dy * dy);
}
```

#### CSS
- Use **CSS custom properties** for theming
- **Mobile-first responsive design**
- **BEM methodology** for class naming
- **Consistent spacing** using CSS variables

```css
/* ✅ Good */
.node {
    --node-size: 60px;
    width: var(--node-size);
    border-radius: 50%;
}

.node--gateway {
    --node-color: var(--danger-red);
}

/* ❌ Avoid */
.redNode {
    width: 60px;
    background: #ff0000;
}
```

#### HTML
- **Semantic markup**
- **Accessibility attributes** (ARIA labels, roles)
- **Progressive enhancement**

### Architecture Overview

The visualizer follows a modular architecture:

```
js/visualizer.js
├── Configuration & Constants
├── Global State Management
├── Utility Functions
├── Logging System
├── MQTT Connection Management
├── Data Processing & Validation
├── Layout Engine (Geometric Algorithms)
├── Node Management
├── Connection Management
├── Simulation System
├── Testing & Debugging Tools
├── Visualization Management
└── UI Management
```

### Key Principles

1. **No External Dependencies** - Keep the core visualizer dependency-free except for Paho MQTT
2. **Browser Compatibility** - Support modern browsers without transpilation
3. **Performance First** - Optimize for real-time performance with many nodes
4. **Accessibility** - Ensure screen reader compatibility and keyboard navigation
5. **Maintainability** - Write self-documenting code with clear separation of concerns

## 🐛 Bug Reports

### Before Submitting a Bug Report

1. **Update to latest version** - Ensure you're using the latest release
2. **Check browser console** - Look for JavaScript errors
3. **Try simulation mode** - Test if the issue occurs with simulated data
4. **Search existing issues** - Check if the bug is already reported

### Bug Report Template

```markdown
**Bug Description**
A clear description of what the bug is.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Environment**
- Browser: [e.g., Chrome 120.0.6099.109]
- OS: [e.g., Windows 11, macOS 13.1, Ubuntu 22.04]
- Visualizer Version: [e.g., 1.4.0]

**MQTT Details** (if applicable)
- Broker: [e.g., mosquitto.example.com:8083]
- Topic: [e.g., uwb/positioning]
- Sample Payload: [e.g., [["A","B",1.5]]]

**Console Errors**
```
Any JavaScript errors from browser console
```

**Additional Context**
Screenshots, network logs, or other helpful information.
```

## ✨ Feature Requests

### Before Submitting a Feature Request

1. **Check existing features** - Ensure the feature doesn't already exist
2. **Review roadmap** - Check if it's already planned
3. **Consider scope** - Think about how it fits with the project goals

### Feature Request Template

```markdown
**Feature Description**
A clear description of what you want to happen.

**Use Case**
Describe the problem this feature would solve.

**Proposed Solution**
Describe how you envision this working.

**Alternatives Considered**
Alternative solutions you've considered.

**Additional Context**
Screenshots, mockups, or examples from other tools.

**Implementation Notes**
Any technical considerations or suggestions.
```

## 🔄 Pull Request Process

### Before Submitting a Pull Request

1. **Create an issue** - Discuss the change first (unless it's a small fix)
2. **Create a feature branch** - Don't work directly on main
3. **Write tests** - Add or update tests for your changes
4. **Update documentation** - Update relevant docs and comments
5. **Test thoroughly** - Test in multiple browsers and scenarios

### Pull Request Template

```markdown
**Description**
Brief description of changes made.

**Related Issue**
Fixes #123

**Type of Change**
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that causes existing functionality to not work as expected)
- [ ] Documentation update

**Testing**
- [ ] Tested with simulation data
- [ ] Tested with real MQTT data
- [ ] Tested in multiple browsers
- [ ] Added/updated tests

**Screenshots** (if applicable)
Before and after screenshots.

**Checklist**
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] New and existing tests pass
```

### Pull Request Guidelines

1. **Small, focused changes** - Keep PRs focused on a single feature or fix
2. **Clear commit messages** - Use descriptive commit messages
3. **Update version number** - Increment `REVISION` in visualizer.js
4. **Test edge cases** - Consider error conditions and edge cases
5. **Maintain backwards compatibility** - Don't break existing MQTT format support

### Commit Message Format

```
type(scope): description

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `perf`: Performance improvements

**Examples:**
```
feat(mqtt): add authentication support

Add username/password authentication for MQTT connections.
Includes UI controls and secure credential handling.

Closes #45

fix(layout): correct triangle positioning for small distances

The triangle layout algorithm was failing for distances < 1m
due to pixel rounding errors. Added minimum distance handling.

docs(api): update MQTT payload examples

Added more comprehensive examples for different node types
and measurement scenarios.
```

## 🧪 Testing Guidelines

### Testing Scope

1. **Functional Testing**:
   - MQTT connection and subscription
   - Data parsing and validation
   - Node creation and positioning
   - Animation and layout updates

2. **Browser Testing**:
   - Chrome/Chromium (latest)
   - Firefox (latest)
   - Safari (latest)
   - Edge (latest)

3. **Performance Testing**:
   - Large number of nodes (50+)
   - High message frequency (>1Hz)
   - Long-running sessions

4. **Accessibility Testing**:
   - Screen reader compatibility
   - Keyboard navigation
   - High contrast mode
   - Reduced motion preferences

### Manual Testing Checklist

**Basic Functionality:**
- [ ] Page loads without errors
- [ ] Simulation mode works
- [ ] Console shows appropriate logs
- [ ] All UI controls respond correctly

**MQTT Testing:**
- [ ] Connection to broker succeeds
- [ ] Subscription to topic works
- [ ] Valid payloads create nodes
- [ ] Invalid payloads show errors
- [ ] Disconnection works cleanly

**Visualization Testing:**
- [ ] Nodes appear in correct positions
- [ ] Connections show between nodes
- [ ] Distance labels show correct values
- [ ] Animations are smooth
- [ ] Layout updates work correctly

**Error Handling:**
- [ ] Invalid JSON shows clear error
- [ ] Network errors are handled gracefully
- [ ] Large payloads don't crash browser
- [ ] Missing nodes don't break layout

## 📚 Documentation Guidelines

### Documentation Types

1. **API Documentation** - Technical specifications in `docs/API.md`
2. **User Guide** - User-facing documentation in `README.md`
3. **Developer Guide** - This file and technical docs
4. **Code Comments** - Inline documentation in source code

### Documentation Standards

- **Clear and concise** - Use simple language
- **Examples included** - Show practical usage
- **Up to date** - Keep in sync with code changes
- **Accessible** - Consider different skill levels

### When to Update Documentation

- Adding new features
- Changing existing behavior
- Fixing bugs that affect usage
- Adding new configuration options
- Updating dependencies

## 🏷️ Release Process

### Version Numbering

We use semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes to MQTT API or core functionality
- **MINOR**: New features, non-breaking enhancements
- **PATCH**: Bug fixes, documentation updates

### Release Checklist

1. **Update version numbers**:
   - `REVISION` in `js/visualizer.js`
   - `version` in `package.json`
   - Version in README.md and docs

2. **Update changelog** - Document all changes since last release

3. **Test thoroughly** - Run full test suite

4. **Create release** - Tag and create GitHub release

5. **Update documentation** - Ensure all docs are current

## 🎯 Project Roadmap

### Short Term (Next Release)
- Enhanced error handling and validation
- Improved mobile responsive design
- Additional layout algorithms
- Performance optimizations

### Medium Term (Next Few Releases)
- 3D visualization support
- Historical data playback
- Advanced filtering and analysis
- WebRTC direct connections

### Long Term (Future Vision)
- Machine learning integration
- Multi-floor building support
- Integration with CAD/floor plans
- Real-time collaboration features

## ❓ Getting Help

### Community Resources

- **GitHub Issues** - For bugs and feature requests
- **GitHub Discussions** - For questions and general discussion
- **Documentation** - Comprehensive guides in `docs/` folder

### Maintainer Contact

- **Email**: your.email@example.com
- **Response Time**: Usually within 48 hours
- **Best for**: Security issues, urgent bugs

### Code of Conduct

We follow the [Contributor Covenant](https://www.contributor-covenant.org/) code of conduct. Please be respectful and constructive in all interactions.

## 🙏 Recognition

Contributors are recognized in several ways:

- **Contributors list** - Added to README.md
- **Release notes** - Mentioned in release announcements  
- **Hall of fame** - Special recognition for significant contributions

Thank you for contributing to the INST Tag Visualizer! Your help makes this project better for everyone. 🚀
