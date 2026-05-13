package main

import (
	"fmt"
	"os"
	"os/exec"
	"time"
)

func executeCmd(message string) (command *exec.Cmd, err error) {
	cmd := exec.Command("sh", "-c", message)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		fmt.Println("Error running command: ", err)
		return nil, err
	}
	return cmd, nil
}

func executeFfmpegCmd(message string) {
	time.Sleep(1 * time.Second)
	for {
		executeCmd(message)
		fmt.Println("ffmpeg exited, restarting in 15s...")
		time.Sleep(15 * time.Second)
	}
}

func main() {
	cam1IP := os.Getenv("CAM1_IP")
	cam2IP := os.Getenv("CAM2_IP")

	if cam1IP == "" || cam2IP == "" {
		fmt.Println("CAM1_IP and CAM2_IP environment variables must be set")
		os.Exit(1)
	}

	path, _ := os.Getwd()
	ffmpegCmd := "ffmpeg -fflags +genpts -f h264 -i tcp://%v:2222 -f rtsp -c copy rtsp://localhost:8554/%v"

	go executeFfmpegCmd(fmt.Sprintf(ffmpegCmd, cam1IP, "cam-1"))
	go executeFfmpegCmd(fmt.Sprintf(ffmpegCmd, cam2IP, "cam-2"))

	go executeCmd("cd ../client; npm run dev")
	go func() {
		for {
			executeCmd("cd ../python-processor; python3 main.py")
			fmt.Println("python processor exited, restarting in 2s...")
			time.Sleep(2 * time.Second)
		}
	}()

	executeCmd(fmt.Sprintf("%s/mediamtx", path))
}
