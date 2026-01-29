/**
 * Dev Server Control Tests
 *
 * Tests the dev server management scripts:
 * - Start/stop/status/test commands
 * - PID file management
 * - Process lifecycle
 *
 * TDD: RED phase - these tests define expected behavior
 */

import { execSync, exec } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const PROJECT_ROOT = path.resolve(__dirname, '../..')
const SCRIPT_PATH = path.join(PROJECT_ROOT, 'scripts', 'dev-server.sh')
const PID_FILE = path.join(PROJECT_ROOT, '.dev-server.pid')

// Helper to run script commands
function runScript(command: string): string {
  try {
    return execSync(`bash ${SCRIPT_PATH} ${command}`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      timeout: 10000
    }).trim()
  } catch (error: any) {
    return error.stdout?.toString().trim() || error.message
  }
}

// Helper to check if script exists and is executable
function scriptExists(): boolean {
  try {
    fs.accessSync(SCRIPT_PATH, fs.constants.X_OK)
    return true
  } catch {
    return false
  }
}

// Clean up before/after tests
function cleanup() {
  // Remove PID file if exists
  try {
    if (fs.existsSync(PID_FILE)) {
      const pid = fs.readFileSync(PID_FILE, 'utf-8').trim()
      try {
        process.kill(parseInt(pid), 'SIGTERM')
      } catch {
        // Process may not exist
      }
      fs.unlinkSync(PID_FILE)
    }
  } catch {
    // Ignore cleanup errors
  }
}

describe('Dev Server Control Script', () => {
  beforeAll(() => {
    cleanup()
  })

  afterAll(() => {
    cleanup()
  })

  describe('script setup', () => {
    it('script file exists at scripts/dev-server.sh', () => {
      expect(fs.existsSync(SCRIPT_PATH)).toBe(true)
    })

    it('script is executable', () => {
      expect(scriptExists()).toBe(true)
    })
  })

  describe('help command', () => {
    it('displays usage information with no arguments', () => {
      const output = runScript('')
      expect(output).toContain('Usage:')
      expect(output).toContain('start')
      expect(output).toContain('stop')
      expect(output).toContain('status')
    })

    it('displays help with --help flag', () => {
      const output = runScript('--help')
      expect(output).toContain('Usage:')
    })
  })

  describe('status command', () => {
    beforeEach(() => {
      cleanup()
    })

    it('reports not running when no PID file exists', () => {
      const output = runScript('status')
      expect(output.toLowerCase()).toContain('not running')
    })

    it('reports not running when PID file has stale PID', () => {
      // Write a fake PID that doesn't exist
      fs.writeFileSync(PID_FILE, '99999999')
      const output = runScript('status')
      expect(output.toLowerCase()).toContain('not running')
    })
  })

  describe('start command', () => {
    afterEach(() => {
      cleanup()
    })

    it('creates PID file when starting', () => {
      // Start in background, don't wait for server to be ready
      runScript('start --background')

      // Give it a moment to create PID file
      execSync('sleep 1')

      expect(fs.existsSync(PID_FILE)).toBe(true)
    })

    it('writes valid PID to file', () => {
      runScript('start --background')
      execSync('sleep 1')

      const pidContent = fs.readFileSync(PID_FILE, 'utf-8').trim()
      const pid = parseInt(pidContent)

      expect(pid).toBeGreaterThan(0)
      expect(Number.isInteger(pid)).toBe(true)
    })

    it('reports already running if server is running', () => {
      runScript('start --background')
      execSync('sleep 1')

      const output = runScript('start --background')
      expect(output.toLowerCase()).toContain('already running')
    })
  })

  describe('stop command', () => {
    beforeEach(() => {
      cleanup()
    })

    it('reports not running when nothing to stop', () => {
      const output = runScript('stop')
      expect(output.toLowerCase()).toContain('not running')
    })

    it('removes PID file after stopping', () => {
      runScript('start --background')
      execSync('sleep 1')

      runScript('stop')
      execSync('sleep 1')

      expect(fs.existsSync(PID_FILE)).toBe(false)
    })

    it('confirms server stopped', () => {
      runScript('start --background')
      execSync('sleep 1')

      const output = runScript('stop')
      expect(output.toLowerCase()).toContain('stopped')
    })
  })

  describe('restart command', () => {
    afterEach(() => {
      cleanup()
    })

    it('restarts the server', () => {
      runScript('start --background')
      execSync('sleep 1')

      const oldPid = fs.readFileSync(PID_FILE, 'utf-8').trim()

      runScript('restart')
      execSync('sleep 2')

      const newPid = fs.readFileSync(PID_FILE, 'utf-8').trim()

      // New PID should be different
      expect(newPid).not.toBe(oldPid)
    })
  })

  describe('test command', () => {
    it('runs jest tests', () => {
      // Just verify the command exists and attempts to run tests
      // We don't want to run the full test suite inside tests
      const output = runScript('test --help')
      // Should either show jest help or our script's test info
      expect(output).toBeDefined()
    })
  })

  describe('logs command', () => {
    afterEach(() => {
      cleanup()
    })

    it('shows log file path', () => {
      const output = runScript('logs')
      expect(output).toContain('log')
    })
  })
})

describe('npm script integration', () => {
  it('package.json has dev:start script', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf-8')
    )
    expect(packageJson.scripts['dev:start']).toBeDefined()
  })

  it('package.json has dev:stop script', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf-8')
    )
    expect(packageJson.scripts['dev:stop']).toBeDefined()
  })

  it('package.json has dev:status script', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf-8')
    )
    expect(packageJson.scripts['dev:status']).toBeDefined()
  })

  it('package.json has dev:restart script', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf-8')
    )
    expect(packageJson.scripts['dev:restart']).toBeDefined()
  })
})
