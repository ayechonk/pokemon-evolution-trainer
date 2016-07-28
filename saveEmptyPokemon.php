<?php 
	$pokemon = file_get_contents('php://input');
	file_put_contents("data/pokemon.json", $pokemon);
	// print $pokedex;