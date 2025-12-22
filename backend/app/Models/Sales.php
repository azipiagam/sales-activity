<?php
// app/Models/Sales.php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Sales extends Authenticatable
{
    use HasApiTokens;

    protected $table = 'sales';
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $fillable = [
        'id', 'username', 'password', 'name', 'email', 'phone', 'is_active'
    ];

    protected $hidden = ['password'];
}