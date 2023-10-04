import { useEffect, useRef, useState } from 'react'
import names from './assets/names.json'
import './App.css'

function App() {
	const input = useRef()
	const loopProgress = useRef() // for animating progress bar
	const deadline = useRef() // deadline for each round

	const [gameRunning, setGameRunning] = useState()
	const [gameEnd, setGameEnd] = useState()
	const [displayState, setDisplayState] = useState('hidden')
	const [score, setScore] = useState()
	const [rounds, setRounds] = useState()
	const [progress, setProgress] = useState(0) // progress bar
	const [shipName, setShipName] = useState('') // main ship name
	const [altNames, setAltNames] = useState() // alt ship names
	const [eventEnabled, setEventEnabled] = useState(true) // disable event during answer display

  const pickedIndices = [] // stores indices of shown ships
  const imageStyles = {
    backgroundImage: `url("https://raw.githubusercontent.com/risbi0/Whos-that-shipgirl/main/img/${displayState}/${shipName.replace(' ', '%20')}.png")`,
		backgroundRepeat: 'no-repeat',
		backgroundSize: 'contain',
		width: '100%',
		height: '100%'
  }

	const delay = () => new Promise(resolve => setTimeout(resolve, 3000))

	function displayCorrectAnswer() {
		setEventEnabled(false)
		// show unhidden ship for a sec before going to next round
		setDisplayState('unhidden')
		delay().then(() => {
			input.current.value = ''
			setDisplayState('hidden')
			setEventEnabled(true)
			setProgress(0)
			newGameRound()
		})
	}

	function checkAnswer() {
		const answer = input.current.value.toLowerCase()
		if (eventEnabled && (answer === shipName.toLowerCase() || altNames.includes(answer))) {
			setScore((score) => score + 1)
			clearInterval(loopProgress.current)
			clearTimeout(deadline.current)
			displayCorrectAnswer()
		}
	}

	function newHiddenShip() {
		let newShipPicked = false, randShipIndex
		while (!newShipPicked) {
			randShipIndex = Math.floor(Math.random() * (names.length - 0 + 1)) + 0

			if (!pickedIndices.includes(randShipIndex)) {
				pickedIndices.push(randShipIndex)
				newShipPicked = true
			}
		}
		setShipName(names[randShipIndex]['filename'])
		setAltNames(names[randShipIndex]['names'])
	}

	function newGameRound() {
		setRounds((rounds) => rounds + 1)
		newHiddenShip()

		const roundDuration = 5000
		const interval = 10
		const totalSteps = roundDuration / interval

		loopProgress.current = setInterval(() => {
			if (progress < 100) {
				setProgress((prevProgress) => prevProgress + (100 / totalSteps))
			}
		}, interval)

		deadline.current = setTimeout(() => {
			clearInterval(loopProgress.current)
			displayCorrectAnswer()
		}, roundDuration)
	}

	function startGame() {
		setScore(0)
		setRounds(0)
		setGameRunning(true)
		setGameEnd(false)
		newGameRound()
	}

	useEffect(() => {
		// end round
		if (rounds === 11) {
			clearInterval(loopProgress.current)
			clearTimeout(deadline.current)
			setGameRunning(false)
			setGameEnd(true)
		}
	}, [rounds])

  return (
    <>
		{
			!gameRunning && !gameEnd &&
			<>
				<div id='answer-display'>Azur Lane Guessing Game</div>
				<div id='container'>
					<ul>
						<li>Guess the Azur Lane character by its silhouette.</li>
						<li>10 rounds with each round having 10 second limit.</li>
						<li>Some characters have nicknames which are also correct.</li>
					</ul>
				</div>
				<button onClick={startGame}>START</button>
			</>
		}
		{
			gameRunning && !gameEnd &&
			<>
				<div id='progress-bar' style={{width: `${progress}%`}}></div>
				<div id='answer-display'>Round {rounds} of 10</div>
				<div id='container'>
					<img style={imageStyles}/>
				</div>
				<input type='text' ref={input} onInput={checkAnswer} placeholder='Who?'></input>
			</>
		}
		{
			!gameRunning && gameEnd &&
			<>
				<div id='score'>
					<p>SCORE</p>
					<p>{score} / 10</p>
				</div>
				<button onClick={startGame}>PLAY AGAIN</button>
			</>
		}
    </>
  )
}

export default App
