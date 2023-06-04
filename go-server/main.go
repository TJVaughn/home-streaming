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

	if err := cmd.Run(); err != nil {
		fmt.Println("Error running command: ", err)
		return nil, err
	}
	return cmd, nil
}

func executeFfmpegCmd(message string) int {
	time.Sleep(1 * time.Second)
	for {
		execRes, err := executeCmd(message)
		if err != nil {
			return 1
		}
		time.Sleep(5 * time.Second)
		execRes.Process.Signal(os.Interrupt)
	}

}

func main() {
	hr, _, _ := time.Now().Clock()
	fmt.Println(hr)
	// executeFfmpegCmd(fmt.Sprintf("echo %v", hr))

	// run the start, but then restart the ffmpegs every hour with a new time?
	path, _ := os.Getwd()
	// ffmpegCmd := "ffmpeg -fflags +genpts -i tcp://192.168.0.%v:2222 -f rtsp -c copy rtsp://localhost:8554/%v -f mp4 -c copy ../raw/hour-cam-%v-%v.mp4 -y"
	// go executeFfmpegCmd(fmt.Sprintf(ffmpegCmd, "184", "cam-1", "1", hr))
	// go executeFfmpegCmd(fmt.Sprintf(ffmpegCmd, "50", "cam-2", "2", hr))
	// go executeFfmpegCmd(fmt.Sprintf(ffmpegCmd, "112", "cam-3", "3", hr))
	ffmpegCmd := "ffmpeg -fflags +genpts -i tcp://192.168.0.%v:2222 -f rtsp -c copy rtsp://localhost:8554/%v "
	go executeFfmpegCmd(fmt.Sprintf(ffmpegCmd, "184", "cam-1"))
	go executeFfmpegCmd(fmt.Sprintf(ffmpegCmd, "50", "cam-2"))
	go executeFfmpegCmd(fmt.Sprintf(ffmpegCmd, "112", "cam-3"))
	// go executeCmd("cd ../client; yarn start")
	executeCmd(fmt.Sprintf("%s/mediamtx", path))
}
