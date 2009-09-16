<?php

/**
 * Test: Nette\Caching\FileStorage and Environment.
 *
 * @author     David Grudl
 * @category   Nette
 * @package    Nette\Caching
 * @subpackage UnitTests
 */

/*use Nette\Caching\Cache;*/
/*use Nette\Environment;*/



require dirname(__FILE__) . '/../NetteTest/initialize.php';



// key and data with special chars
$key = '../' . implode('', range("\x00", "\x1F"));
$value = range("\x00", "\xFF");

// temporary directory
define('TEMP_DIR', dirname(__FILE__) . '/tmp');
NetteTestHelpers::purge(TEMP_DIR);

Environment::setVariable('tempDir', TEMP_DIR);

$cache = Environment::getCache();


dump( isset($cache[$key]), 'Is cached?' );
dump( $cache[$key], 'Cache content' );

output('Writing cache...');
$cache[$key] = $value;
$cache->release();

dump( isset($cache[$key]), 'Is cached?' );
dump( $cache[$key] === $value, 'Is cache ok?' );

output('Removing from cache using unset()...');
unset($cache[$key]);
$cache->release();

dump( isset($cache[$key]), 'Is cached?' );

output('Removing from cache using set NULL...');
$cache[$key] = $value;
$cache[$key] = NULL;
$cache->release();

dump( isset($cache[$key]), 'Is cached?' );



__halt_compiler();

------EXPECT------
Is cached? bool(FALSE)

Cache content: NULL

Writing cache...

Is cached? bool(TRUE)

Is cache ok? bool(TRUE)

Removing from cache using unset()...

Is cached? bool(FALSE)

Removing from cache using set NULL...

Is cached? bool(FALSE)
