package main

import (
	"fmt"
	"os"
	"os/exec"
)

func executeCmd(message string) {
	// fmt.Println(message)
	cmd := exec.Command("sh", "-c", message)

	cmd.Stdout = os.Stdout

	if err := cmd.Run(); err != nil {
		fmt.Println("Error running command: ", err)
	}
}

func cmdBuilder() {
	fmt.Println("starting")

	path, _ := os.Getwd()

	startMediaMtx := fmt.Sprintf("%s/mediamtx", path)

	sources := []string{"50", "184"}
	endpoints := []string{"cam", "cam-2"}
	messages := []string{}

	if len(sources) != len(endpoints) {
		fmt.Println("sources and endpoints not equal")
		return
	}

	go executeCmd(startMediaMtx)
	for i, source := range sources {
		messages = append(messages, fmt.Sprintf("ffmpeg -fflags +genpts -i tcp://192.168.0.%v:2222 -f rtsp -c copy rtsp://localhost:8554/%v", source, endpoints[i]))
		go executeCmd(messages[i])
	}

}

func main() {
	path, _ := os.Getwd()
	executeCmd(fmt.Sprintf("%s/mediamtx", path))
	// stops after first command
	executeCmd(fmt.Sprintf("ffmpeg -fflags +genpts -i tcp://192.168.0.%v:2222 -f rtsp -c copy rtsp://localhost:8554/%v", "50", "cam"))
	executeCmd(fmt.Sprintf("ffmpeg -fflags +genpts -i tcp://192.168.0.%v:2222 -f rtsp -c copy rtsp://localhost:8554/%v", "184", "cam-2"))
}
