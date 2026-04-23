<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Tymon\JWTAuth\Facades\JWTAuth;
use App\Models\CentralUser;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

        $user = CentralUser::where('username', $request->username)
            ->where('is_active', 1)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // Ambil nama department via join
        $department = DB::connection('pilargroup')
            ->table('master_departments')
            ->where('id', $user->department_id)
            ->value('name');

        $allowedDepartments = ['Gosave GT', 'IT', 'Board Of Director'];
        if (!in_array($department, $allowedDepartments)) {
            return response()->json(['message' => 'Access denied for your department'], 403);
        }

        $apps = DB::connection('pilargroup')
            ->table('central_user_projects as cup')
            ->join('master_projects as mp', 'cup.project_id', '=', 'mp.id')
            ->where('cup.user_id', $user->id)
            ->pluck('mp.slug')
            ->toArray();

        if (!in_array('touchpoint', $apps)) {
            return response()->json(['message' => 'Access denied for this application'], 403);
        }

        $token = JWTAuth::claims(['apps' => $apps])->fromUser($user);

        $userData = [
            'id'           => $user->id,
            'internal_id'  => $user->internal_id,
            'username'     => $user->username,
            'name'         => $user->name,
            'department'   => $department, // nama string hasil join
            'job_position' => $user->job_position,
            'apps'         => $apps,
        ];

        return response()->json([
            'token' => $token,
            'user'  => $userData,
            'sales' => $userData,
        ]);
    }

    public function me(Request $request)
    {
        $user = auth('api')->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $department = DB::connection('pilargroup')
            ->table('master_departments')
            ->where('id', $user->department_id)
            ->value('name');

        return response()->json([
            'id'           => $user->id,
            'internal_id'  => $user->internal_id,
            'username'     => $user->username,
            'name'         => $user->name,
            'department'   => $department,
            'department_id'=> $user->department_id,
            'job_position' => $user->job_position,
            'job_level_id' => $user->job_level_id,
        ]);
    }

    public function logout()
    {
        JWTAuth::invalidate(JWTAuth::getToken());
        return response()->json(['message' => 'Logged out successfully']);
    }
}