package main

import (
	"fmt"
	"os"
	"os/exec"
	"time"
)

func executeCmd(message string, sleep bool) int {

	if sleep {
		time.Sleep(1 * time.Second)
	}

	cmd := exec.Command("sh", "-c", message)

	cmd.Stdout = os.Stdout

	if err := cmd.Run(); err != nil {
		fmt.Println("Error running command: ", err)
		return 1
	}
	return 0
}

func main() {
	path, _ := os.Getwd()
	ffmpegCmd := "ffmpeg -fflags +genpts -i tcp://192.168.0.%v:2222 -f rtsp -c copy rtsp://localhost:8554/%v"
	go executeCmd(fmt.Sprintf(ffmpegCmd, "184", "cam"), true)
	go executeCmd(fmt.Sprintf(ffmpegCmd, "50", "cam-2"), true)
	go executeCmd("cd ../client; yarn start", false)
	executeCmd(fmt.Sprintf("%s/mediamtx", path), false)
}
