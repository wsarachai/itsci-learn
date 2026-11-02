package com.example.wellness.service;

import com.example.wellness.model.District;
import com.example.wellness.repository.DistrictRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DistrictService {

    private final DistrictRepository districtRepository;

    public DistrictService(DistrictRepository districtRepository) {
        this.districtRepository = districtRepository;
    }

    public List<District> listAlldistrict() {
        return districtRepository.findAll();
    }
}
