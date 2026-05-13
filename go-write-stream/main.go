package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"time"
)

func checkErr(err error) {
	if err != nil {
		panic(err)
	}
}

func executeCmd(message string) (command *exec.Cmd, err error) {

	cmd := exec.Command("sh", "-c", message)

	cmd.Stdout = os.Stdout

	if err := cmd.Run(); err != nil {
		fmt.Println("Error running command: ", err)
		return nil, err
	}
	// time.Sleep(10 * time.Second)
	// fmt.Println("we waited, and now we shall dine")
	// cmd.Process.Signal(os.Interrupt)
	return cmd, nil
}

func formatTimeItem(input int) string {
	if input < 10 {
		return fmt.Sprintf("0%v", input)
	}
	return strconv.Itoa(input)
}

func executeFfmpegCmd(rawMessage string, outputPath string) int {
	fmt.Println("Waiting a second, and then running")
	time.Sleep(1 * time.Second)
	fmt.Println("GO!")
	for {
		hr, min, sec := time.Now().Clock()

		if hr < 5 || hr > 20 {
			fmt.Printf("%v:%v: Not going to record. Checking again in 1 hour \n", hr, min)
			time.Sleep(1 * time.Hour)
			continue
		}
		output := fmt.Sprintf("%s/%v:%v:%v.mp4", outputPath, formatTimeItem(hr), formatTimeItem(min), formatTimeItem(sec))
		fmt.Printf("Starting to record: %s\n", output)
		message := fmt.Sprintf("%s %s", rawMessage, output)
		_, err := executeCmd(message)
		if err != nil {
			return 1
		}
	}

	// fmt.Println("Returning")
	// return 0
	// time.Sleep(5 * time.Second)
	// execRes.Process.Signal(os.Interrupt)

}

func main() {
	year, month, day := time.Now().Date()
	outputPath := filepath.Join(".", fmt.Sprintf("../outputs/%v-%v-%v/", year, month, day))

	err := os.MkdirAll(outputPath, os.ModePerm)
	checkErr(err)

	ffmpegCmd := `ffmpeg -i tcp://192.168.0.%v:2222 -t 01:00:00 -filter_complex "[0:v]setpts=PTS/1.3[v]" -map "[v]" -vcodec libx265 -crf 32 `
	executeFfmpegCmd(fmt.Sprintf(ffmpegCmd, "50"), outputPath)
}
