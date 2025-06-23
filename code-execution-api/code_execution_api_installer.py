import os
import sys
import subprocess
import shutil
import tempfile
import zipfile
import urllib.request
import ctypes
import winreg
import time
import getpass
import threading
import webbrowser
from pathlib import Path
from datetime import datetime
from tkinter import Tk, Label, Button, Canvas, PhotoImage, Frame, TOP, BOTH, X, StringVar
from tkinter.ttk import Progressbar, Style

# Configuration
PROJECT_NAME = "code-execution-api"
PROJECT_ZIP_URL = "https://github.com/SohamMhatre09/Code-Execution-API/archive/refs/heads/main.zip"
INSTALL_DIR = os.path.join(os.environ["PROGRAMDATA"], "CodeExecutionAPI")
DOCKER_INSTALLER_URL = "https://desktop.docker.com/win/stable/Docker%20Desktop%20Installer.exe"
MINICONDA_INSTALLER_URL = "https://repo.anaconda.com/miniconda/Miniconda3-latest-Windows-x86_64.exe"
LOG_FILE = os.path.join(tempfile.gettempdir(), "code_execution_api_installer.log")

# GUI Setup
class InstallerGUI:
    def __init__(self, master):
        self.master = master
        master.title("Code Execution API Installer")
        master.geometry("600x400")
        master.resizable(False, False)
        
        # Set window icon if available
        try:
            master.iconbitmap("installer_icon.ico")
        except:
            pass
        
        # Style configuration
        self.style = Style()
        self.style.configure("TProgressbar", thickness=15)
        
        # Header
        self.header_frame = Frame(master, bg="#2c3e50", height=60)
        self.header_frame.pack(fill=X)
        
        self.title_label = Label(self.header_frame, text="Code Execution API Installer", 
                                fg="white", bg="#2c3e50", font=("Arial", 16, "bold"))
        self.title_label.pack(pady=15)
        
        # Main content
        self.content_frame = Frame(master, bg="white")
        self.content_frame.pack(fill=BOTH, expand=True)
        
        self.status_var = StringVar()
        self.status_var.set("Initializing installation...")
        
        self.status_label = Label(self.content_frame, textvariable=self.status_var,
                                 font=("Arial", 12), bg="white")
        self.status_label.pack(pady=(30, 15))
        
        self.progress = Progressbar(self.content_frame, style="TProgressbar", length=500)
        self.progress.pack(pady=10)
        
        self.detail_var = StringVar()
        self.detail_var.set("Preparing to install...")
        
        self.detail_label = Label(self.content_frame, textvariable=self.detail_var,
                                 font=("Arial", 10), bg="white")
        self.detail_label.pack(pady=5)
        
        # Buttons
        self.button_frame = Frame(self.content_frame, bg="white")
        self.button_frame.pack(side=TOP, pady=30)
        
        self.install_button = Button(self.button_frame, text="Install", width=15, height=2,
                                    bg="#3498db", fg="white", font=("Arial", 10, "bold"),
                                    command=self.start_installation)
        self.install_button.pack(side="left", padx=10)
        
        self.cancel_button = Button(self.button_frame, text="Cancel", width=15, height=2,
                                   bg="#e74c3c", fg="white", font=("Arial", 10, "bold"),
                                   command=self.master.destroy)
        self.cancel_button.pack(side="left", padx=10)
        
        # Footer
        self.footer = Label(master, text="© 2025 CodeExecutionAPI - All rights reserved", 
                           bg="#ecf0f1", fg="#7f8c8d", font=("Arial", 8))
        self.footer.pack(side="bottom", fill=X, pady=5)
        
    def start_installation(self):
        self.install_button.config(state="disabled")
        self.cancel_button.config(state="disabled")
        threading.Thread(target=self.run_installation, daemon=True).start()
    
    def run_installation(self):
        try:
            # Run the installation process
            installer = CodeAPIInstaller(self)
            installer.install()
        except Exception as e:
            log_error(f"Installation failed: {str(e)}")
            self.update_status("Installation failed", f"Error: {str(e)}")
            self.install_button.config(state="normal", text="Retry")
            self.cancel_button.config(state="normal")
    
    def update_status(self, status, detail="", progress=None):
        self.status_var.set(status)
        if detail:
            self.detail_var.set(detail)
        if progress is not None:
            self.progress["value"] = progress
        self.master.update_idletasks()
    
    def complete_installation(self):
        self.update_status("Installation Complete!", "The API is now ready to use.", 100)
        self.install_button.config(text="Open API", state="normal", 
                                  command=lambda: webbrowser.open("http://localhost:8000"))
        self.cancel_button.config(text="Exit", state="normal")


def log_message(message):
    """Write a message to the log file"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, "a") as f:
        f.write(f"[{timestamp}] {message}\n")
    print(message)

def log_error(message):
    """Log an error message"""
    log_message(f"ERROR: {message}")

def is_admin():
    """Check if the script is running with administrator privileges"""
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

def restart_as_admin():
    """Restart the script with administrator privileges"""
    ctypes.windll.shell32.ShellExecuteW(
        None, "runas", sys.executable, " ".join(sys.argv), None, 1
    )
    sys.exit(0)

def download_file(url, destination, progress_callback=None):
    """Download a file with progress indication"""
    log_message(f"Downloading from {url}...")
    
    def report_progress(blocknum, blocksize, totalsize):
        readsofar = blocknum * blocksize
        if totalsize > 0:
            percent = min(readsofar * 100 / totalsize, 100)
            if progress_callback:
                progress_callback(percent)
    
    try:
        urllib.request.urlretrieve(url, destination, reporthook=report_progress)
        log_message(f"Download completed to {destination}")
        return True
    except Exception as e:
        log_error(f"Error downloading file: {e}")
        return False

def check_docker_installed():
    """Check if Docker Desktop is installed"""
    try:
        # Try multiple detection methods
        
        # Method 1: Check Registry
        try:
            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, "SOFTWARE\\Docker Inc.\\Docker Desktop") as key:
                return True
        except WindowsError:
            pass
        
        # Method 2: Check Program Files
        docker_paths = [
            os.path.join(os.environ["ProgramFiles"], "Docker", "Docker", "Docker Desktop.exe"),
            os.path.join(os.environ["ProgramFiles(x86)"], "Docker", "Docker", "Docker Desktop.exe")
        ]
        
        for path in docker_paths:
            if os.path.exists(path):
                return True
        
        # Method 3: Check if docker command works
        try:
            result = subprocess.run(["docker", "--version"], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                return True
        except:
            pass
            
        return False
    except Exception as e:
        log_error(f"Error checking Docker installation: {e}")
        return False

def install_docker(gui=None):
    """Download and install Docker Desktop with better error handling"""
    if gui:
        gui.update_status("Installing Docker Desktop", "Downloading Docker installer...", 15)
    
    # Download Docker installer
    temp_dir = tempfile.gettempdir()
    docker_installer = os.path.join(temp_dir, "DockerDesktopInstaller.exe")
    
    if download_file(DOCKER_INSTALLER_URL, docker_installer, 
                    progress_callback=lambda p: gui.update_status("Installing Docker Desktop", 
                                                               f"Downloading: {p:.1f}%", 15 + p * 0.15) if gui else None):
        
        if gui:
            gui.update_status("Installing Docker Desktop", "Running installer...", 30)
        
        log_message("Running Docker Desktop installer...")
        
        # Try different installation methods
        try:
            # Method 1: Interactive installation (more reliable but shows UI)
            process = subprocess.Popen([docker_installer], shell=True)
            
            if gui:
                gui.update_status("Installing Docker Desktop", 
                               "Docker Desktop installer is running. Please complete the installation when prompted.", 35)
                
                # Check periodically if Docker gets installed during installation
                max_checks = 30  # 5 minutes
                for i in range(max_checks):
                    time.sleep(10)  # Check every 10 seconds
                    if check_docker_installed():
                        process.terminate()  # Try to close installer if it's still running
                        log_message("Docker Desktop installation detected!")
                        gui.update_status("Docker Desktop Installed", "Installation completed successfully!", 45)
                        return True
                    gui.update_status("Installing Docker Desktop", 
                                   f"Waiting for installation to complete... ({i+1}/{max_checks})", 
                                   35 + (i/max_checks) * 10)
                    
                # If we get here, we timed out waiting for installation
                process.terminate()
                gui.update_status("Docker Installation", "Installation taking longer than expected. Proceeding...", 45)
                return check_docker_installed()
            else:
                # Without GUI, we'll wait for the process to complete
                process.wait()
                return check_docker_installed()
                
        except Exception as e:
            log_error(f"Error during Docker installation: {e}")
            
            # Fallback method: Try silent installation
            try:
                if gui:
                    gui.update_status("Installing Docker Desktop", "Trying alternate installation method...", 35)
                
                # Try silent install as fallback
                result = subprocess.run([docker_installer, "install", "--quiet"], 
                                      capture_output=True, text=True, timeout=300)
                
                # Check if Docker was installed
                return check_docker_installed()
            except Exception as e2:
                log_error(f"Fallback Docker installation failed: {e2}")
                return False
    
    return False

def check_conda_installed():
    """Check if Miniconda is installed with improved detection"""
    try:
        # Try multiple detection methods
        
        # Method 1: Check if conda command works
        try:
            result = subprocess.run(["conda", "--version"], 
                                  capture_output=True, text=True, shell=True, timeout=5)
            if result.returncode == 0:
                return True
        except:
            pass
        
        # Method 2: Check common installation paths
        conda_paths = [
            os.path.join(os.environ["USERPROFILE"], "Miniconda3", "Scripts", "conda.exe"),
            os.path.join(os.environ["USERPROFILE"], "Anaconda3", "Scripts", "conda.exe"),
            os.path.join(os.environ["ProgramFiles"], "Miniconda3", "Scripts", "conda.exe"),
            os.path.join(os.environ["ProgramFiles"], "Anaconda3", "Scripts", "conda.exe"),
        ]
        
        for path in conda_paths:
            if os.path.exists(path):
                # Add to PATH for this session
                conda_dir = os.path.dirname(os.path.dirname(path))
                os.environ["PATH"] = f"{conda_dir};{os.path.join(conda_dir, 'Scripts')};{os.environ['PATH']}"
                return True
                
        return False
    except Exception as e:
        log_error(f"Error checking Conda installation: {e}")
        return False

def install_miniconda(gui=None):
    """Download and install Miniconda with better error handling"""
    if gui:
        gui.update_status("Installing Miniconda", "Downloading Miniconda installer...", 45)
    
    # Download Miniconda installer
    temp_dir = tempfile.gettempdir()
    miniconda_installer = os.path.join(temp_dir, "Miniconda3_Installer.exe")
    
    if download_file(MINICONDA_INSTALLER_URL, miniconda_installer,
                   progress_callback=lambda p: gui.update_status("Installing Miniconda", 
                                                              f"Downloading: {p:.1f}%", 
                                                             45 + p * 0.15) if gui else None):
        if gui:
            gui.update_status("Installing Miniconda", "Running installer...", 60)
        
        log_message("Running Miniconda installer...")
        
        try:
            # Silent installation
            install_path = os.path.join(os.environ["USERPROFILE"], "Miniconda3")
            result = subprocess.run([miniconda_installer, "/InstallationType=JustMe", 
                                   "/AddToPath=1", "/RegisterPython=1", "/S", f"/D={install_path}"], 
                                   capture_output=True, text=True)
            
            # Add conda to PATH for this session
            os.environ["PATH"] = f"{install_path};{os.path.join(install_path, 'Scripts')};{os.environ['PATH']}"
            
            # Check if conda is now available
            time.sleep(2)  # Give the system a moment
            if check_conda_installed():
                log_message("Miniconda installation completed successfully!")
                if gui:
                    gui.update_status("Miniconda Installed", "Installation completed successfully!", 65)
                return True
            
            # If we get here, the silent install might have failed
            if gui:
                gui.update_status("Installing Miniconda", "Trying interactive installation...", 60)
                
            # Try interactive installation as fallback
            process = subprocess.Popen([miniconda_installer], shell=True)
            
            if gui:
                gui.update_status("Installing Miniconda", 
                               "Miniconda installer is running. Please complete the installation when prompted.", 60)
                
                # Check periodically if Conda gets installed
                max_checks = 18  # 3 minutes
                for i in range(max_checks):
                    time.sleep(10)  # Check every 10 seconds
                    if check_conda_installed():
                        process.terminate()  # Try to close installer if it's still running
                        log_message("Miniconda installation detected!")
                        gui.update_status("Miniconda Installed", "Installation completed successfully!", 65)
                        return True
                    gui.update_status("Installing Miniconda", 
                                   f"Waiting for installation to complete... ({i+1}/{max_checks})", 
                                   60 + (i/max_checks) * 5)
                
                # If we get here, we timed out waiting for installation
                process.terminate()
                gui.update_status("Miniconda Installation", "Installation taking longer than expected. Proceeding...", 65)
                return check_conda_installed()
            else:
                # Without GUI, we'll wait for the process to complete
                process.wait()
                return check_conda_installed()
                
        except Exception as e:
            log_error(f"Error during Miniconda installation: {e}")
            return False
    
    return False

def download_and_extract_project(gui=None):
    """Download and extract the project files"""
    if gui:
        gui.update_status("Downloading Project Files", "Preparing to download...", 65)
    
    log_message("Downloading and extracting project files...")
    
    # Create temp directory
    temp_dir = tempfile.mkdtemp()
    zip_path = os.path.join(temp_dir, "code-execution-api.zip")
    
    # Download project ZIP
    if not download_file(PROJECT_ZIP_URL, zip_path,
                       progress_callback=lambda p: gui.update_status("Downloading Project Files", 
                                                                  f"Downloading: {p:.1f}%", 
                                                                 65 + p * 0.1) if gui else None):
        log_error("Failed to download project files")
        return False
    
    # Create installation directory
    os.makedirs(INSTALL_DIR, exist_ok=True)
    
    # Extract files
    if gui:
        gui.update_status("Installing Project Files", "Extracting files...", 75)
    
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # Get the name of the top-level directory in the ZIP
            top_dir = os.path.commonprefix([name for name in zip_ref.namelist() if name.endswith('/')])
            
            # Extract all files
            zip_ref.extractall(temp_dir)
            
            # Move files from the extracted directory to the install directory
            extracted_dir = os.path.join(temp_dir, top_dir)
            for item in os.listdir(extracted_dir):
                source = os.path.join(extracted_dir, item)
                dest = os.path.join(INSTALL_DIR, item)
                
                # Remove destination if it exists
                if os.path.exists(dest):
                    if os.path.isdir(dest):
                        shutil.rmtree(dest)
                    else:
                        os.remove(dest)
                
                # Move item to destination
                shutil.move(source, dest)
        
        # Clean up
        shutil.rmtree(temp_dir)
        log_message("Project files extracted successfully!")
        
        if gui:
            gui.update_status("Project Files Installed", "Files extracted successfully", 80)
        
        return True
    except Exception as e:
        log_error(f"Error extracting project files: {e}")
        return False

def create_conda_environment(gui=None):
    """Create a conda environment for the project"""
    if gui:
        gui.update_status("Setting Up Python Environment", "Creating conda environment...", 80)
    
    log_message("Setting up Python environment...")
    
    env_name = "code_execution_api"
    
    try:
        # Check if environment already exists
        result = subprocess.run(["conda", "env", "list"], capture_output=True, text=True, shell=True)
        if env_name in result.stdout:
            log_message(f"Conda environment '{env_name}' already exists. Updating...")
            if gui:
                gui.update_status("Setting Up Python Environment", "Updating existing environment...", 85)
            
            subprocess.run(["conda", "env", "update", "-n", env_name, "--file", 
                           os.path.join(INSTALL_DIR, "requirements.txt")], shell=True)
        else:
            # Create new environment
            log_message(f"Creating conda environment '{env_name}'...")
            if gui:
                gui.update_status("Setting Up Python Environment", "Creating new environment...", 82)
            
            subprocess.run(["conda", "create", "-n", env_name, "python=3.11", "-y"], shell=True)
        
        # Install requirements
        log_message("Installing project dependencies...")
        if gui:
            gui.update_status("Setting Up Python Environment", "Installing dependencies...", 85)
        
        subprocess.run(["conda", "run", "-n", env_name, "pip", "install", "-r", 
                       os.path.join(INSTALL_DIR, "requirements.txt")], shell=True)
        
        log_message("Python environment setup completed successfully!")
        if gui:
            gui.update_status("Python Environment Ready", "Environment setup complete", 90)
        
        return True
    except Exception as e:
        log_error(f"Error setting up Python environment: {e}")
        return False

def create_startup_scripts(gui=None):
    """Create batch scripts to start and stop the service"""
    if gui:
        gui.update_status("Creating Startup Scripts", "Setting up shortcuts...", 90)
    
    log_message("Creating startup scripts...")
    
    try:
        # Start script
        start_script = os.path.join(INSTALL_DIR, "start_api.bat")
        with open(start_script, "w") as f:
            f.write("@echo off\n")
            f.write("echo Starting Code Execution API...\n")
            f.write(f"cd /d {INSTALL_DIR}\n")
            f.write("docker-compose up -d\n")
            f.write("echo API is running at http://localhost:8000\n")
            f.write("start http://localhost:8000\n")
            f.write("exit\n")
        
        # Stop script
        stop_script = os.path.join(INSTALL_DIR, "stop_api.bat")
        with open(stop_script, "w") as f:
            f.write("@echo off\n")
            f.write("echo Stopping Code Execution API...\n")
            f.write(f"cd /d {INSTALL_DIR}\n")
            f.write("docker-compose down\n")
            f.write("echo API has been stopped.\n")
            f.write("exit\n")
        
        # Create desktop shortcut
        desktop_path = os.path.join(os.environ["USERPROFILE"], "Desktop")
        shortcut_path = os.path.join(desktop_path, "Code Execution API.lnk")
        
        vbs_script = os.path.join(tempfile.gettempdir(), "create_shortcut.vbs")
        with open(vbs_script, "w") as f:
            f.write(f'Set oWS = WScript.CreateObject("WScript.Shell")\n')
            f.write(f'sLinkFile = "{shortcut_path}"\n')
            f.write(f'Set oLink = oWS.CreateShortcut(sLinkFile)\n')
            f.write(f'oLink.TargetPath = "{start_script}"\n')
            f.write(f'oLink.WorkingDirectory = "{INSTALL_DIR}"\n')
            f.write(f'oLink.Description = "Start Code Execution API"\n')
            f.write(f'oLink.IconLocation = "%SystemRoot%\\System32\\SHELL32.dll,21"\n')
            f.write(f'oLink.Save\n')
        
        subprocess.run(["cscript", "/nologo", vbs_script])
        os.remove(vbs_script)
        
        # Add to Start Menu
        start_menu_path = os.path.join(os.environ["APPDATA"], "Microsoft", "Windows", "Start Menu", "Programs")
        start_menu_folder = os.path.join(start_menu_path, "Code Execution API")
        os.makedirs(start_menu_folder, exist_ok=True)
        
        start_menu_shortcut = os.path.join(start_menu_folder, "Code Execution API.lnk")
        stop_menu_shortcut = os.path.join(start_menu_folder, "Stop Code Execution API.lnk")
        
        # Create Start Menu shortcut for Start
        vbs_script = os.path.join(tempfile.gettempdir(), "create_start_menu_shortcut.vbs")
        with open(vbs_script, "w") as f:
            f.write(f'Set oWS = WScript.CreateObject("WScript.Shell")\n')
            f.write(f'sLinkFile = "{start_menu_shortcut}"\n')
            f.write(f'Set oLink = oWS.CreateShortcut(sLinkFile)\n')
            f.write(f'oLink.TargetPath = "{start_script}"\n')
            f.write(f'oLink.WorkingDirectory = "{INSTALL_DIR}"\n')
            f.write(f'oLink.Description = "Start Code Execution API"\n')
            f.write(f'oLink.IconLocation = "%SystemRoot%\\System32\\SHELL32.dll,21"\n')
            f.write(f'oLink.Save\n')
        
        subprocess.run(["cscript", "/nologo", vbs_script])
        os.remove(vbs_script)
        
        # Create Start Menu shortcut for Stop
        vbs_script = os.path.join(tempfile.gettempdir(), "create_stop_menu_shortcut.vbs")
        with open(vbs_script, "w") as f:
            f.write(f'Set oWS = WScript.CreateObject("WScript.Shell")\n')
            f.write(f'sLinkFile = "{stop_menu_shortcut}"\n')
            f.write(f'Set oLink = oWS.CreateShortcut(sLinkFile)\n')
            f.write(f'oLink.TargetPath = "{stop_script}"\n')
            f.write(f'oLink.WorkingDirectory = "{INSTALL_DIR}"\n')
            f.write(f'oLink.Description = "Stop Code Execution API"\n')
            f.write(f'oLink.IconLocation = "%SystemRoot%\\System32\\SHELL32.dll,27"\n')
            f.write(f'oLink.Save\n')
        
        subprocess.run(["cscript", "/nologo", vbs_script])
        os.remove(vbs_script)
        
        log_message(f"Startup scripts created in {INSTALL_DIR}")
        log_message(f"Desktop shortcut created at {shortcut_path}")
        
        if gui:
            gui.update_status("Shortcuts Created", "All shortcuts successfully created", 95)
        
        return True
    except Exception as e:
        log_error(f"Error creating startup scripts: {e}")
        return False

def start_docker_services(gui=None):
    """Start the Docker services"""
    if gui:
        gui.update_status("Starting Services", "Building Docker container...", 95)
    
    log_message("Starting Docker services...")
    
    try:
        # Change to install directory
        os.chdir(INSTALL_DIR)
        
        # Build and start containers
        log_message("Building Docker container...")
        build_process = subprocess.run(["docker-compose", "build"], 
                                   shell=True, capture_output=True, text=True)
        
        if build_process.returncode != 0:
            log_error(f"Docker build failed: {build_process.stderr}")
            if gui:
                gui.update_status("Docker Build Failed", 
                                "Please check that Docker Desktop is running and try again.", 95)
            return False
        
        if gui:
            gui.update_status("Starting Services", "Starting Docker container...", 98)
        
        log_message("Starting Docker container...")
        start_process = subprocess.run(["docker-compose", "up", "-d"], 
                                    shell=True, capture_output=True, text=True)
        
        if start_process.returncode != 0:
            log_error(f"Docker start failed: {start_process.stderr}")
            if gui:
                gui.update_status("Docker Start Failed", 
                                "Please check that Docker Desktop is running and try again.", 98)
            return False
        
        log_message("Code Execution API is now running at http://localhost:8000")
        if gui:
            gui.update_status("Installation Complete", "API is now running at http://localhost:8000", 100)
        
        return True
    except Exception as e:
        log_error(f"Error starting Docker services: {e}")
        return False

class CodeAPIInstaller:
    def __init__(self, gui=None):
        self.gui = gui
    
    def install(self):
        """Run the full installation process"""
        self.log_install_start()
        
        # Check Docker
        if not check_docker_installed():
            log_message("Docker Desktop is not installed. Installing now...")
            if not install_docker(self.gui):
                if self.gui:
                    self.gui.update_status("Docker Installation Issue", 
                                       "Could not install Docker automatically. Please install Docker Desktop manually.")
                log_error("Failed to install Docker Desktop")
                return False
        else:
            log_message("Docker Desktop is already installed.")
            if self.gui:
                self.gui.update_status("Docker Check", "Docker Desktop is already installed", 15)
        
        # Check Miniconda
        if not check_conda_installed():
            log_message("Miniconda is not installed. Installing now...")
            if not install_miniconda(self.gui):
                if self.gui:
                    self.gui.update_status("Miniconda Installation Issue", 
                                       "Could not install Miniconda automatically.")
                log_error("Failed to install Miniconda")
                return False
        else:
            log_message("Miniconda is already installed.")
            if self.gui:
                self.gui.update_status("Miniconda Check", "Miniconda is already installed", 45)
        
        # Download and extract project
        if not download_and_extract_project(self.gui):
            if self.gui:
                self.gui.update_status("Project Download Failed", 
                                   "Could not download project files. Please check your internet connection.")
            log_error("Failed to download and extract project files")
            return False
        
        # Create conda environment
        if not create_conda_environment(self.gui):
            if self.gui:
                self.gui.update_status("Environment Setup Failed", 
                                   "Could not set up Python environment.")
            log_error("Failed to create conda environment")
            return False
        
        # Create startup scripts
        if not create_startup_scripts(self.gui):
            if self.gui:
                self.gui.update_status("Shortcut Creation Failed", 
                                   "Could not create startup shortcuts.")
            log_error("Failed to create startup scripts")
            return False
        
        # Start Docker services
        if not start_docker_services(self.gui):
            if self.gui:
                self.gui.update_status("Service Start Failed", 
                                   "Could not start Docker services. Please make sure Docker Desktop is running.")
            log_error("Failed to start Docker services")
            return False
        
        # Installation complete
        log_message("Installation completed successfully!")