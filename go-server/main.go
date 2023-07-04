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

	// run the start, but then restart the ffmpegs every hour with a new time?
	path, _ := os.Getwd()
	ffmpegCmd := "ffmpeg -fflags +genpts -i tcp://192.168.0.%v:2222 -f rtsp -crf 32 -c copy rtsp://localhost:8554/%v "
	go executeFfmpegCmd(fmt.Sprintf(ffmpegCmd, "184", "cam-2"))
	go executeFfmpegCmd(fmt.Sprintf(ffmpegCmd, "50", "cam-1"))
	go executeFfmpegCmd(fmt.Sprintf(ffmpegCmd, "249", "cam-3"))
	go executeCmd("cd ../client; npm run start")

	// ffmpegCmd := "ffmpeg -fflags +genpts -i tcp://192.168.0.%v:2222 -i tcp://192.168.0.%v:2222 -f rtsp hstack -c copy rtsp://localhost:8554/%v"
	// ffmpegCmd := "ffmpeg -fflags +genpts -i tcp://192.168.0.50:2222 -i tcp://192.168.0.184:2222 -i tcp://192.168.0.249:2222 -filter_complex \"[0:v][1:v][2:v]hstack=inputs=3[v]\" -map \"[v]\" -f rtsp -c:v h264 -crf 32 -bf 0 rtsp://localhost:8554/cam-1"
	// go executeFfmpegCmd(ffmpegCmd)

	executeCmd(fmt.Sprintf("%s/mediamtx", path))
}
